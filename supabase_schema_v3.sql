-- ============================================================
-- supabase_schema_v3.sql  —  OmniDrive Enterprise Files
--
-- Run this in your Supabase SQL Editor.
-- It is safe to run on an existing DB (uses IF NOT EXISTS / DO blocks).
-- Builds on top of v2 — run v2 first if starting fresh.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLES THAT ALREADY EXIST (from v1/v2) — kept for reference
-- ─────────────────────────────────────────────────────────────
--   profiles     (id, email, payload, updated_at)
--   files        (id, user_id, payload, updated_at)
--   audit_logs   (id, user_id, payload, updated_at)
--   devices      (id, user_id, payload, updated_at)
--   favorites    (user_id, file_id, created_at)
--   vault_items  (id, user_id, name, encrypted_content, salt, iv, ...)

-- ─────────────────────────────────────────────────────────────
-- NEW TABLE 1: team_spaces
-- A workspace that multiple users (identified by firebase uid)
-- can belong to. Files with sharing='Team' reference a space.
-- ─────────────────────────────────────────────────────────────
create table if not exists team_spaces (
  id          text primary key,            -- e.g. 'ts-abc123'
  name        text not null,
  description text,
  owner_id    text not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Members of a team space (many-to-many)
create table if not exists team_space_members (
  team_space_id text not null references team_spaces(id) on delete cascade,
  user_id       text not null references profiles(id) on delete cascade,
  role          text not null default 'member',   -- 'owner' | 'admin' | 'member'
  joined_at     timestamptz not null default now(),
  primary key (team_space_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- NEW TABLE 2: projects
-- Top-level project containers (maps to root-level folders in
-- My Files with type='folder').
-- ─────────────────────────────────────────────────────────────
create table if not exists projects (
  id             text primary key,          -- e.g. 'proj-xyz'
  user_id        text not null references profiles(id) on delete cascade,
  name           text not null,
  description    text,
  status         text not null default 'active',  -- 'active' | 'archived' | 'completed'
  team_space_id  text references team_spaces(id) on delete set null,
  folder_id      text,                      -- FK to files.id (the root folder)
  color          text,                      -- UI accent color e.g. '#6366f1'
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- NEW TABLE 3: file_tags
-- Flexible tagging system — used for AI tags, user-defined labels,
-- and category markers (e.g. 'work', 'personal', 'invoice').
-- ─────────────────────────────────────────────────────────────
create table if not exists file_tags (
  id         text primary key,              -- e.g. 'tag-001'
  file_id    text not null,                 -- references files.id (no hard FK — file can be deleted)
  user_id    text not null references profiles(id) on delete cascade,
  tag        text not null,
  source     text not null default 'user',  -- 'user' | 'ai'
  created_at timestamptz not null default now(),
  unique (file_id, user_id, tag)
);

-- ─────────────────────────────────────────────────────────────
-- NEW TABLE 4: shared_links
-- Tracks public/shared links generated for files.
-- ─────────────────────────────────────────────────────────────
create table if not exists shared_links (
  id          text primary key,             -- unique short token
  file_id     text not null,
  user_id     text not null references profiles(id) on delete cascade,
  sharing     text not null default 'Shared', -- 'Public' | 'Shared' | 'Team'
  expires_at  timestamptz,                  -- null = never expires
  access_count integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
create index if not exists team_spaces_owner_idx        on team_spaces(owner_id);
create index if not exists team_space_members_user_idx  on team_space_members(user_id);
create index if not exists projects_user_id_idx         on projects(user_id);
create index if not exists projects_team_space_idx      on projects(team_space_id);
create index if not exists file_tags_file_id_idx        on file_tags(file_id);
create index if not exists file_tags_user_id_idx        on file_tags(user_id);
create index if not exists shared_links_file_id_idx     on shared_links(file_id);
create index if not exists shared_links_user_id_idx     on shared_links(user_id);

-- ─────────────────────────────────────────────────────────────
-- RLS — deny all direct client access; proxy uses service_role
-- ─────────────────────────────────────────────────────────────
alter table team_spaces         enable row level security;
alter table team_space_members  enable row level security;
alter table projects            enable row level security;
alter table file_tags           enable row level security;
alter table shared_links        enable row level security;

-- Drop any leftover permissive policies on the new tables
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
    and tablename in ('team_spaces','team_space_members','projects','file_tags','shared_links')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "deny_all_team_spaces"        on team_spaces        for all using (false) with check (false);
create policy "deny_all_team_space_members" on team_space_members  for all using (false) with check (false);
create policy "deny_all_projects"           on projects            for all using (false) with check (false);
create policy "deny_all_file_tags"          on file_tags           for all using (false) with check (false);
create policy "deny_all_shared_links"       on shared_links        for all using (false) with check (false);

revoke all on team_spaces, team_space_members, projects, file_tags, shared_links
  from anon, authenticated;
grant  all on team_spaces, team_space_members, projects, file_tags, shared_links
  to service_role;

-- ─────────────────────────────────────────────────────────────
-- SUMMARY OF ALL TABLES (for quick reference)
-- ─────────────────────────────────────────────────────────────
-- From v1/v2 (already created):
--   ✅ profiles
--   ✅ files
--   ✅ audit_logs
--   ✅ devices
--   ✅ favorites
--   ✅ vault_items
--
-- New in v3 (this file):
--   🆕 team_spaces          — team workspaces
--   🆕 team_space_members   — who belongs to each space
--   🆕 projects             — project containers (linked to folders)
--   🆕 file_tags            — tags per file (user or AI-generated)
--   🆕 shared_links         — public/shared link tracking
-- ─────────────────────────────────────────────────────────────
