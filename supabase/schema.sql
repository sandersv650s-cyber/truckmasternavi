-- Run once in the Supabase SQL Editor for a fresh project.
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
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  original_text text not null check (char_length(original_text) between 1 and 2000),
  original_language text not null,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages(conversation_id, created_at desc);
create table public.message_translations (
  message_id uuid not null references public.messages(id) on delete cascade,
  language text not null,
  translated_text text not null,
  primary key (message_id, language)
);
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

-- Security definer avoids recursive RLS checks on conversation_members.
create function public.is_member(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversation_members where conversation_id = cid and user_id = (select auth.uid()));
$$;
revoke all on function public.is_member(uuid) from public;
grant execute on function public.is_member(uuid) to authenticated;

create function public.start_conversation(other_ids uuid[], group_title text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  clean_ids uuid[];
  cid uuid;
begin
  if me is null then raise exception 'Aanmelden vereist'; end if;
  select array_agg(distinct x) into clean_ids from unnest(other_ids) x where x is not null and x <> me;
  if clean_ids is null or array_length(clean_ids, 1) > 19 then raise exception 'Kies 1 tot 19 andere deelnemers'; end if;
  if (select count(*) from public.profiles where id = any(clean_ids)) <> array_length(clean_ids, 1) then raise exception 'Onbekende gebruiker'; end if;
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

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_translations enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy profile_read on public.profiles for select to authenticated using (true);
create policy profile_own_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy conversation_read on public.conversations for select to authenticated using (public.is_member(id));
create policy member_read on public.conversation_members for select to authenticated using (public.is_member(conversation_id));
create policy message_read on public.messages for select to authenticated using (public.is_member(conversation_id));
create policy translation_read on public.message_translations for select to authenticated using (exists (select 1 from public.messages m where m.id = message_id and public.is_member(m.conversation_id)));
create policy blocks_read on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy blocks_insert on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy blocks_delete on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));

-- Changes are filtered by RLS for subscribed authenticated clients.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_translations;
