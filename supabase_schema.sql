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

create index if not exists files_user_id_idx on files(user_id);
create index if not exists audit_logs_user_id_idx on audit_logs(user_id);
create index if not exists devices_user_id_idx on devices(user_id);

alter table profiles enable row level security;
alter table files enable row level security;
alter table audit_logs enable row level security;
alter table devices enable row level security;

-- This app uses Firebase Auth on the client, so Supabase receives only the
-- anon key. For a class/demo project, open policies keep the client simple.
-- For production, proxy these calls through your server and verify Firebase
-- ID tokens before writing to Supabase.
create policy "client profiles access"
  on profiles for all
  using (true)
  with check (true);

create policy "client files access"
  on files for all
  using (true)
  with check (true);

create policy "client audit logs access"
  on audit_logs for all
  using (true)
  with check (true);

create policy "client devices access"
  on devices for all
  using (true)
  with check (true);
