-- Run this in your Supabase SQL editor (supabase.com → project → SQL editor)

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamptz default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  score int not null,
  duration int not null,
  is_daily boolean not null default false,
  group_id uuid references groups(id) on delete set null,
  played_at timestamptz default now()
);

-- ─── Row-level security ───────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table sessions enable row level security;

-- Profiles: anyone can read, owner can write
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Helper: returns the group IDs the current user belongs to, bypassing RLS
create or replace function get_user_group_ids(uid uuid)
returns setof uuid
language sql
security definer
stable
as $$
  select group_id from group_members where user_id = uid;
$$;

-- Groups: only members can see their groups
drop policy if exists "groups_select" on groups;
drop policy if exists "groups_insert" on groups;
create policy "groups_select" on groups for select
  using (id in (select get_user_group_ids(auth.uid())));
create policy "groups_insert" on groups for insert
  with check (auth.uid() = created_by);

-- Group members: members can see who's in their groups
drop policy if exists "group_members_select" on group_members;
drop policy if exists "group_members_insert" on group_members;
drop policy if exists "group_members_delete" on group_members;
create policy "group_members_select" on group_members for select
  using (group_id in (select get_user_group_ids(auth.uid())));
create policy "group_members_insert" on group_members for insert
  with check (auth.uid() = user_id);
create policy "group_members_delete" on group_members for delete
  using (auth.uid() = user_id);

-- Sessions: public read (for leaderboards), owner writes
drop policy if exists "sessions_select" on sessions;
drop policy if exists "sessions_insert" on sessions;
create policy "sessions_select" on sessions for select using (true);
create policy "sessions_insert" on sessions for insert with check (auth.uid() = user_id);

-- ─── Leaderboard RPC ─────────────────────────────────────────────────────────

create or replace function get_leaderboard(p_group_id uuid, p_duration int)
returns table(username text, best_score int, session_count bigint)
language sql security definer
as $$
  select
    p.username,
    coalesce(max(s.score), 0)::int as best_score,
    count(s.id) as session_count
  from group_members gm
  join profiles p on p.id = gm.user_id
  left join sessions s on s.user_id = gm.user_id and s.duration = p_duration and s.is_daily = true and s.group_id = p_group_id
  where gm.group_id = p_group_id
  group by p.username, gm.user_id
  order by best_score desc;
$$;
