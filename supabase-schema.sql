-- ══════════════════════════════════════════════
-- Agents Hub — Supabase Schema
-- ══════════════════════════════════════════════

-- Members (assignable people per workspace)
create table members (
  id text primary key,
  name text not null,
  initials text not null,
  color text not null,
  workspace_id text not null
);

-- Tasks
create table tasks (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text not null default '',
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  workspace_id text not null,
  assignee_id text references members(id) on delete set null,
  created_at timestamptz not null default now(),
  position int not null default 0
);

-- Leads
create table leads (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  company text not null default '',
  value text not null default '',
  source text not null default '',
  stage text not null default 'new' check (stage in ('new', 'contacted', 'qualified', 'won', 'lost')),
  workspace_id text not null,
  assignee_id text references members(id) on delete set null,
  created_at timestamptz not null default now(),
  position int not null default 0
);

-- Projects
create table projects (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  initials text not null,
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'planning', 'paused')),
  image text,
  workspace_id text not null,
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════
-- Seed data: Members
-- ══════════════════════════════════════════════

-- Shared agents (ggv workspace)
insert into members (id, name, initials, color, workspace_id) values
  ('shrams', 'Shrams', 'SH', 'bg-purple-600', 'ggv'),
  ('iris', 'Íris', 'IR', 'bg-emerald-600', 'ggv'),
  ('atlas', 'Atlas', 'AT', 'bg-blue-600', 'ggv'),
  ('marcus', 'Marcus', 'MR', 'bg-orange-600', 'ggv'),
  ('scout', 'Scout', 'SC', 'bg-cyan-600', 'ggv'),
  ('pieter', 'Pieter', 'PT', 'bg-yellow-600', 'ggv'),
  ('phc', 'PHC', 'PH', 'bg-red-600', 'avgroup'),
  ('karpitz', 'Karpitz', 'KP', 'bg-indigo-600', 'ggv');

-- Alburiware members
insert into members (id, name, initials, color, workspace_id) values
  ('nuno', 'Nuno Dias', 'ND', 'bg-teal-600', 'alburiware'),
  ('guilherme', 'Guilherme Veríssimo', 'GV', 'bg-teal-600', 'alburiware');

-- Agiliz members
insert into members (id, name, initials, color, workspace_id) values
  ('lourenco', 'Lourenço Barros', 'LB', 'bg-violet-600', 'agiliz'),
  ('david', 'David Martins', 'DM', 'bg-sky-600', 'agiliz'),
  ('rafael', 'Rafael Peixoto', 'RP', 'bg-amber-600', 'agiliz'),
  ('frederico', 'Frederico Silva', 'FS', 'bg-rose-600', 'agiliz');

-- ══════════════════════════════════════════════
-- Seed data: Tasks (Alburiware)
-- ══════════════════════════════════════════════

insert into tasks (id, title, description, status, workspace_id, assignee_id, position) values
  ('aw-1', 'Setup CI/CD pipeline', 'Initialize GitHub Actions for automated deployments', 'not_started', 'alburiware', 'shrams', 0),
  ('aw-2', 'Design system tokens', 'Define color palette, spacing, and typography tokens', 'not_started', 'alburiware', null, 1),
  ('aw-3', 'Implement REST routes', 'Set up REST API routes for agents', 'in_progress', 'alburiware', 'atlas', 0),
  ('aw-4', 'Add authentication', 'Integrate Supabase auth with login/signup', 'done', 'alburiware', 'iris', 0),
  ('aw-5', 'Dashboard layout', 'Build sidebar navigation and main layout', 'done', 'alburiware', 'nuno', 1);

-- ══════════════════════════════════════════════
-- Seed data: Leads (Alburiware)
-- ══════════════════════════════════════════════

insert into leads (id, name, company, value, source, stage, workspace_id, assignee_id, position) values
  ('aw-l1', 'João Leite', 'Grupo Luso', '15.000 EUR', 'LinkedIn', 'new', 'alburiware', 'guilherme', 0),
  ('aw-l2', 'Mariana Costa', 'Nexus Digital', '4.200 EUR', 'Website', 'new', 'alburiware', null, 1),
  ('aw-l3', 'Ricardo Ferreira', 'PortoTech', '9.500 EUR', 'Referral', 'contacted', 'alburiware', 'guilherme', 0),
  ('aw-l4', 'Sofia Mendes', 'InovaSoft', '22.000 EUR', 'Cold outreach', 'qualified', 'alburiware', 'nuno', 0),
  ('aw-l5', 'Carlos Almeida', 'BuildWare', '12.000 EUR', 'Event', 'won', 'alburiware', 'guilherme', 0);

-- ══════════════════════════════════════════════
-- Seed data: Leads (Agiliz)
-- ══════════════════════════════════════════════

insert into leads (id, name, company, value, source, stage, workspace_id, assignee_id, position) values
  ('ag-l1', 'Pedro Santos', 'TechFlow', '2.500 EUR', 'Website', 'new', 'agiliz', 'rafael', 0),
  ('ag-l2', 'Ana Rodrigues', 'DataPrime', '8.000 EUR', 'Referral', 'contacted', 'agiliz', 'lourenco', 0);

-- ══════════════════════════════════════════════
-- Seed data: Projects (ggv)
-- ══════════════════════════════════════════════

insert into projects (id, name, initials, description, status, image, workspace_id) values
  ('p-agiliz', 'Agiliz', 'AG', 'Plataforma de gestão de projetos', 'active', '/agiliz.png', 'ggv'),
  ('p-alburiware', 'Alburiware', 'AW', 'Software company', 'active', '/alburiware-logo.svg', 'ggv'),
  ('p-avgroup', 'AV Group', 'AV', 'Grupo empresarial', 'active', null, 'ggv');

-- ══════════════════════════════════════════════
-- RLS (Row Level Security) — disable for now, enable later with auth
-- ══════════════════════════════════════════════

alter table members enable row level security;
alter table tasks enable row level security;
alter table leads enable row level security;
alter table projects enable row level security;

-- Allow all access via anon key (no auth yet)
create policy "Allow all" on members for all using (true) with check (true);
create policy "Allow all" on tasks for all using (true) with check (true);
create policy "Allow all" on leads for all using (true) with check (true);
create policy "Allow all" on projects for all using (true) with check (true);
