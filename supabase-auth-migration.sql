-- ══════════════════════════════════════════════
-- Auth Migration: profiles, RLS, triggers
-- ══════════════════════════════════════════════

-- 1. Profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  workspace_id text not null,
  role text not null default 'member'
    check (role in ('super_admin', 'admin', 'member')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- 2. Helper functions
create or replace function public.user_workspace_id()
returns text
language sql
stable
security definer
as $$
  select workspace_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  )
$$;

-- 3. Profile RLS
create policy "read_own_profile" on profiles for select
  using (auth.uid() = id or public.is_super_admin());

create policy "update_own_profile" on profiles for update
  using (auth.uid() = id);

-- 4. Drop old permissive policies
drop policy if exists "Allow all select" on members;
drop policy if exists "Allow all insert" on members;
drop policy if exists "Allow all update" on members;
drop policy if exists "Allow all delete" on members;

drop policy if exists "Allow all select" on tasks;
drop policy if exists "Allow all insert" on tasks;
drop policy if exists "Allow all update" on tasks;
drop policy if exists "Allow all delete" on tasks;

drop policy if exists "Allow all select" on leads;
drop policy if exists "Allow all insert" on leads;
drop policy if exists "Allow all update" on leads;
drop policy if exists "Allow all delete" on leads;

drop policy if exists "Allow all select" on projects;
drop policy if exists "Allow all insert" on projects;
drop policy if exists "Allow all update" on projects;
drop policy if exists "Allow all delete" on projects;

-- 5. New RLS policies — members
create policy "select_members" on members for select using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "insert_members" on members for insert with check (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "update_members" on members for update using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "delete_members" on members for delete using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);

-- 6. New RLS policies — tasks
create policy "select_tasks" on tasks for select using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "insert_tasks" on tasks for insert with check (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "update_tasks" on tasks for update using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "delete_tasks" on tasks for delete using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);

-- 7. New RLS policies — leads
create policy "select_leads" on leads for select using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "insert_leads" on leads for insert with check (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "update_leads" on leads for update using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "delete_leads" on leads for delete using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);

-- 8. New RLS policies — projects
create policy "select_projects" on projects for select using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "insert_projects" on projects for insert with check (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "update_projects" on projects for update using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);
create policy "delete_projects" on projects for delete using (
  public.is_super_admin() or workspace_id = public.user_workspace_id()
);

-- 9. Re-enable RLS (in case it was disabled)
alter table members enable row level security;
alter table tasks enable row level security;
alter table leads enable row level security;
alter table projects enable row level security;

-- 10. Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, workspace_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'workspace_id', 'ggv'),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
