-- ============================================================
-- supabase_schema_v2.sql
-- Run this in Supabase SQL editor to upgrade the schema.
-- Safe to run on an existing DB (uses IF NOT EXISTS / DO blocks).
-- ============================================================

-- ── Core tables (unchanged, kept for fresh installs) ─────────────────────────

create table if not exists profiles (
  id text primary key,
  email text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists files (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists devices (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── NEW: favorites table ──────────────────────────────────────────────────────
-- Stores which file IDs the user has starred. Simple & fast.

create table if not exists favorites (
  user_id text not null references profiles(id) on delete cascade,
  file_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, file_id)
);

-- ── NEW: vault_items table ────────────────────────────────────────────────────
-- Encrypted vault entries. content is AES-GCM encrypted client-side;
-- password_hint is an optional plaintext reminder (not the password itself).
-- salt + iv are stored so the browser can re-derive the key and decrypt.

create table if not exists vault_items (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  name text not null,
  -- AES-GCM encrypted content, stored as base64
  encrypted_content text not null,
  -- Random 16-byte salt used for PBKDF2 key derivation, base64
  salt text not null,
  -- Random 12-byte IV for AES-GCM, base64
  iv text not null,
  -- Optional plaintext hint ("first pet's name?") — NOT the password
  password_hint text,
  size_bytes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists files_user_id_idx      on files(user_id);
create index if not exists audit_logs_user_id_idx on audit_logs(user_id);
create index if not exists devices_user_id_idx    on devices(user_id);
create index if not exists favorites_user_id_idx  on favorites(user_id);
create index if not exists vault_items_user_id_idx on vault_items(user_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- All tables use the same server-proxy pattern: the Express server holds the
-- service-role key (bypasses RLS) and verifies Firebase tokens before writing.
-- Client-side access is blocked entirely.

alter table profiles    enable row level security;
alter table files       enable row level security;
alter table audit_logs  enable row level security;
alter table devices     enable row level security;
alter table favorites   enable row level security;
alter table vault_items enable row level security;

-- Drop old permissive policies if they exist
do $$ begin
  drop policy if exists "client profiles access"   on profiles;
  drop policy if exists "client files access"      on files;
  drop policy if exists "client audit logs access" on audit_logs;
  drop policy if exists "client devices access"    on devices;
exception when others then null; end $$;

-- Deny everything from the client (service_role bypasses RLS automatically)
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
    and tablename in ('profiles','files','audit_logs','devices','favorites','vault_items')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "deny_all_profiles"    on profiles    for all using (false) with check (false);
create policy "deny_all_files"       on files       for all using (false) with check (false);
create policy "deny_all_audit_logs"  on audit_logs  for all using (false) with check (false);
create policy "deny_all_devices"     on devices     for all using (false) with check (false);
create policy "deny_all_favorites"   on favorites   for all using (false) with check (false);
create policy "deny_all_vault_items" on vault_items for all using (false) with check (false);

-- Grant only to service_role
revoke all on profiles,files,audit_logs,devices,favorites,vault_items from anon, authenticated;
grant  all on profiles,files,audit_logs,devices,favorites,vault_items to service_role;
