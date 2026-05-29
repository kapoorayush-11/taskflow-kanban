-- TaskFlow — Supabase schema
-- Run this ONCE in your Supabase project: SQL Editor → New query → paste → Run.

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.projects (
  id         uuid primary key,
  name       text not null,
  color      text not null,
  created_at text not null
);

create table if not exists public.tasks (
  id          uuid primary key,
  project_id  uuid not null references public.projects(id) on delete cascade,
  column_id   text not null,
  title       text not null,
  description text not null default '',
  assignee    text not null default '',
  due_date    text,
  priority    text not null default 'medium',
  sort_order  integer not null default 0,
  created_at  text not null,
  updated_at  text not null
);

create index if not exists tasks_project_id_idx on public.tasks (project_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- DEMO policy: anyone holding the public anon key can read/write. This is what
-- lets your whole team share one board with no login. It is intentionally open
-- and NOT production-secure — tighten with auth before real-world use.

alter table public.projects enable row level security;
alter table public.tasks    enable row level security;

drop policy if exists "Demo public access - projects" on public.projects;
drop policy if exists "Demo public access - tasks"    on public.tasks;

create policy "Demo public access - projects" on public.projects
  for all using (true) with check (true);
create policy "Demo public access - tasks" on public.tasks
  for all using (true) with check (true);

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Broadcast row changes so every open browser updates live.

alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.tasks;
