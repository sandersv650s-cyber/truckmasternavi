-- For an existing installation of the original plaintext schema.
-- This irrevocably removes OLD messages and translations from the live database.
-- Supabase backups and logs may retain old plaintext; manage their retention separately.
begin;

drop table if exists public.message_translations;
drop table if exists public.messages;

create table if not exists public.user_keys (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  public_key text not null check (char_length(public_key) = 44),
  created_at timestamptz not null default now()
);
create table if not exists public.encrypted_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  sender_public_key text not null,
  created_at timestamptz not null default now()
);
create index if not exists encrypted_messages_conversation_idx on public.encrypted_messages(conversation_id, created_at desc);
create table if not exists public.message_envelopes (
  message_id uuid not null references public.encrypted_messages(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id),
  nonce text not null check (char_length(nonce) = 32),
  ciphertext text not null check (char_length(ciphertext) between 1 and 16000),
  primary key (message_id, recipient_id)
);
create index if not exists message_envelopes_recipient_idx on public.message_envelopes(recipient_id);

create or replace function public.store_encrypted_message(cid uuid, sender uuid, sender_key text, envelopes jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare mid uuid; ids uuid[]; supplied uuid[]; item jsonb;
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

alter table public.user_keys enable row level security;
alter table public.encrypted_messages enable row level security;
alter table public.message_envelopes enable row level security;
create policy key_read on public.user_keys for select to authenticated using (true);
create policy key_once on public.user_keys for insert to authenticated with check (user_id = (select auth.uid()));
create policy encrypted_message_read on public.encrypted_messages for select to authenticated using (public.is_member(conversation_id));
create policy envelope_own_read on public.message_envelopes for select to authenticated using (recipient_id = (select auth.uid()) and exists (select 1 from public.encrypted_messages m where m.id = message_id and public.is_member(m.conversation_id)));
alter publication supabase_realtime add table public.message_envelopes;

commit;
