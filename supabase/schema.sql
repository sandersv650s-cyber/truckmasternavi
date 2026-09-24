-- Fresh Supabase project schema. Never store message plaintext in this database.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  language text not null default 'nl' check (language in ('nl','en','de','fr','es','pt','it','ja','ko','zh','tr','pl','uk','id','ar')),
  country text check (char_length(country) <= 60),
  bio text check (char_length(bio) <= 300),
  created_at timestamptz not null default now()
);
create table public.user_keys (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  public_key text not null check (char_length(public_key) = 44),
  created_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text check (char_length(title) <= 80),
  created_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members(user_id);
create table public.encrypted_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  sender_public_key text not null,
  created_at timestamptz not null default now()
);
create index encrypted_messages_conversation_idx on public.encrypted_messages(conversation_id, created_at desc);
create table public.message_envelopes (
  message_id uuid not null references public.encrypted_messages(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id),
  nonce text not null check (char_length(nonce) = 32),
  ciphertext text not null check (char_length(ciphertext) between 1 and 16000),
  primary key (message_id, recipient_id)
);
create index message_envelopes_recipient_idx on public.message_envelopes(recipient_id);
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_id uuid not null references public.profiles(id),
  reason text not null check (reason in ('spam','abuse')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create function public.make_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, 'u_' || left(replace(new.id::text, '-', ''), 20), 'Nieuwe gebruiker');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.make_profile();

create function public.is_member(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversation_members where conversation_id = cid and user_id = (select auth.uid()));
$$;
revoke all on function public.is_member(uuid) from public;
grant execute on function public.is_member(uuid) to authenticated;

create function public.start_conversation(other_ids uuid[], group_title text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid(); clean_ids uuid[]; cid uuid;
begin
  if me is null then raise exception 'Aanmelden vereist'; end if;
  select array_agg(distinct x) into clean_ids from unnest(other_ids) x where x is not null and x <> me;
  if clean_ids is null or array_length(clean_ids, 1) > 19 then raise exception 'Kies 1 tot 19 andere deelnemers'; end if;
  if (select count(*) from public.user_keys where user_id = any(clean_ids)) <> array_length(clean_ids, 1) then raise exception 'Een deelnemer heeft nog geen versleuteling ingesteld'; end if;
  if exists (select 1 from public.blocks where (blocker_id = me and blocked_id = any(clean_ids)) or (blocked_id = me and blocker_id = any(clean_ids))) then raise exception 'Een gebruiker is geblokkeerd'; end if;
  if array_length(clean_ids, 1) = 1 then
    select c.id into cid from public.conversations c
    where c.title is null and (select count(*) from public.conversation_members m where m.conversation_id = c.id) = 2
      and exists (select 1 from public.conversation_members m where m.conversation_id = c.id and m.user_id = me)
      and exists (select 1 from public.conversation_members m where m.conversation_id = c.id and m.user_id = clean_ids[1])
    limit 1;
    if cid is not null then return cid; end if;
  end if;
  insert into public.conversations(title) values (case when array_length(clean_ids, 1) > 1 then nullif(left(trim(group_title), 80), '') else null end) returning id into cid;
  insert into public.conversation_members(conversation_id, user_id) values (cid, me);
  insert into public.conversation_members(conversation_id, user_id) select cid, unnest(clean_ids);
  return cid;
end; $$;
revoke all on function public.start_conversation(uuid[], text) from public;
grant execute on function public.start_conversation(uuid[], text) to authenticated;

-- Only the service role can invoke this transaction; the Edge Function authenticates the sender.
create function public.store_encrypted_message(cid uuid, sender uuid, sender_key text, envelopes jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  mid uuid; ids uuid[]; supplied uuid[]; item jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(sender::text, 0));
  select array_agg(user_id order by user_id) into ids from public.conversation_members where conversation_id = cid;
  if ids is null or not sender = any(ids) then raise exception 'Geen toegang tot gesprek'; end if;
  if sender_key is distinct from (select public_key from public.user_keys where user_id = sender) then raise exception 'Sleutel komt niet overeen'; end if;
  if exists (select 1 from public.blocks where (blocker_id = sender and blocked_id = any(ids)) or (blocked_id = sender and blocker_id = any(ids))) then raise exception 'Geblokkeerd'; end if;
  if (select count(*) from public.encrypted_messages where sender_id = sender and created_at > now() - interval '1 minute') >= 15 then raise exception 'Te veel berichten'; end if;
  if jsonb_typeof(envelopes) is distinct from 'array' or jsonb_array_length(envelopes) <> array_length(ids, 1) then raise exception 'Ontbrekende versleutelde kopie'; end if;
  select array_agg((x->>'recipient_id')::uuid order by (x->>'recipient_id')::uuid) into supplied from jsonb_array_elements(envelopes) x;
  if supplied is distinct from ids then raise exception 'Deelnemers komen niet overeen'; end if;
  if exists (select 1 from jsonb_array_elements(envelopes) x where char_length(x->>'nonce') <> 32 or char_length(x->>'ciphertext') not between 1 and 16000) then raise exception 'Ongeldige versleutelde kopie'; end if;
  insert into public.encrypted_messages(conversation_id, sender_id, sender_public_key) values (cid, sender, sender_key) returning id into mid;
  for item in select * from jsonb_array_elements(envelopes) loop
    insert into public.message_envelopes(message_id, recipient_id, nonce, ciphertext)
    values (mid, (item->>'recipient_id')::uuid, item->>'nonce', item->>'ciphertext');
  end loop;
  return mid;
end; $$;
revoke all on function public.store_encrypted_message(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.store_encrypted_message(uuid, uuid, text, jsonb) to service_role;

alter table public.profiles enable row level security;
alter table public.user_keys enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.encrypted_messages enable row level security;
alter table public.message_envelopes enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
create policy profile_read on public.profiles for select to authenticated using (true);
create policy profile_own_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy key_read on public.user_keys for select to authenticated using (true);
create policy key_once on public.user_keys for insert to authenticated with check (user_id = (select auth.uid()));
create policy conversation_read on public.conversations for select to authenticated using (public.is_member(id));
create policy member_read on public.conversation_members for select to authenticated using (public.is_member(conversation_id));
create policy encrypted_message_read on public.encrypted_messages for select to authenticated using (public.is_member(conversation_id));
create policy envelope_own_read on public.message_envelopes for select to authenticated using (recipient_id = (select auth.uid()) and exists (select 1 from public.encrypted_messages m where m.id = message_id and public.is_member(m.conversation_id)));
create policy blocks_read on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy blocks_insert on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy blocks_delete on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));

alter publication supabase_realtime add table public.message_envelopes;
