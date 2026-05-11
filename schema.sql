create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text unique not null,
  xp integer not null default 50 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  current_level integer not null default 1 check (current_level >= 1),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  slug text unique not null,
  title text not null,
  description text,
  starter_code text,
  solution text,
  xp_reward integer not null default 25 check (xp_reward > 0),
  order_index integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  completed boolean not null default false,
  attempts integer not null default 0 check (attempts >= 0),
  completed_at timestamp with time zone,
  unique (user_id, challenge_id)
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  module_id text not null,
  badge_name text not null,
  earned_at timestamp with time zone not null default now(),
  unique (user_id, module_id)
);

alter table public.users enable row level security;
alter table public.challenges enable row level security;
alter table public.progress enable row level security;
alter table public.badges enable row level security;

create policy "Users can read own profile"
on public.users for select
using (auth.uid() = auth_user_id);

create policy "Users can update own profile"
on public.users for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

create policy "Authenticated users can read challenges"
on public.challenges for select
using (auth.uid() is not null);

create policy "Users can read own progress"
on public.progress for select
using (
  exists (
    select 1 from public.users
    where users.id = progress.user_id
    and users.auth_user_id = auth.uid()
  )
);

create policy "Users can update own progress"
on public.progress for insert
with check (
  exists (
    select 1 from public.users
    where users.id = progress.user_id
    and users.auth_user_id = auth.uid()
  )
);

create policy "Users can read own badges"
on public.badges for select
using (
  exists (
    select 1 from public.users
    where users.id = badges.user_id
    and users.auth_user_id = auth.uid()
  )
);
