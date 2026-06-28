-- ============================================================
-- supabase_schema_v4.sql  —  OmniDrive Enterprise Files
--
-- New in v4:
--   🆕 profile_pictures  — stores uploaded avatar/profile pics
--                          as base64 data URLs or Supabase Storage URLs.
--
-- Run after v1, v2, v3.
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE: profile_pictures
--
-- Stores the user's profile picture.
-- One row per user (upsert on upload).
--
-- `storage_url`  — public URL from Supabase Storage bucket
--                  (preferred — keeps the main profiles table lean).
-- `data_url`     — base64 data URL fallback (used when Storage bucket
--                  is not configured; matches what the React app stores
--                  in UserAccount.avatarUrl).
-- `mime_type`    — e.g. 'image/jpeg', 'image/png', 'image/webp'
-- `size_bytes`   — original file size for quota tracking
-- ─────────────────────────────────────────────────────────────
create table if not exists profile_pictures (
  id           text primary key default gen_random_uuid()::text,

  -- FK to profiles.id (the Firebase uid)
  user_id      text not null references profiles(id) on delete cascade,

  -- Supabase Storage public URL (set when using the Storage bucket)
  storage_url  text,

  -- Base64 data URL fallback (used in demo / no-bucket mode)
  -- Large column — kept separate from profiles to avoid bloating
  -- the profiles table on every workspace load.
  data_url     text,

  -- Image metadata
  mime_type    text not null default 'image/jpeg',
  size_bytes   integer not null default 0,
  file_name    text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Only one picture per user
  unique (user_id)
);

-- Trigger to auto-update updated_at on every upsert
create or replace function update_profile_pictures_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profile_pictures_updated_at on profile_pictures;
create trigger trg_profile_pictures_updated_at
  before update on profile_pictures
  for each row execute function update_profile_pictures_updated_at();

-- ─────────────────────────────────────────────────────────────
-- INDEX
-- ─────────────────────────────────────────────────────────────
create index if not exists profile_pictures_user_id_idx on profile_pictures(user_id);

-- ─────────────────────────────────────────────────────────────
-- RLS — deny all direct client access; server uses service_role
-- ─────────────────────────────────────────────────────────────
alter table profile_pictures enable row level security;

-- Drop any existing policies first
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profile_pictures'
  loop
    execute format('drop policy if exists %I on public.profile_pictures', r.policyname);
  end loop;
end $$;

create policy "deny_all_profile_pictures"
  on profile_pictures for all
  using (false)
  with check (false);

revoke all on profile_pictures from anon, authenticated;
grant  all on profile_pictures to service_role;

-- ─────────────────────────────────────────────────────────────
-- SERVER-SIDE UPSERT HELPER (call from your Express proxy)
--
-- Usage from Node.js / server.ts:
--
--   await supabaseAdmin
--     .from('profile_pictures')
--     .upsert(
--       {
--         user_id:    firebaseUid,   // e.g. 'abc123'
--         data_url:   dataUrl,       // base64 string from client
--         mime_type:  'image/jpeg',
--         size_bytes: byteLength,
--         file_name:  'avatar.jpg'
--       },
--       { onConflict: 'user_id' }   // one row per user — update on re-upload
--     );
--
-- To read it back:
--
--   const { data } = await supabaseAdmin
--     .from('profile_pictures')
--     .select('data_url, storage_url, updated_at')
--     .eq('user_id', firebaseUid)
--     .maybeSingle();
--
--   const avatarUrl = data?.storage_url ?? data?.data_url ?? null;
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- OPTIONAL: Supabase Storage bucket for avatars
--
-- Run this in Supabase SQL Editor only if you want to use
-- Storage instead of base64 data_url:
--
--   insert into storage.buckets (id, name, public)
--   values ('avatars', 'avatars', true)
--   on conflict do nothing;
--
-- Then upload from Node.js with:
--
--   const { data: upload } = await supabaseAdmin.storage
--     .from('avatars')
--     .upload(`${firebaseUid}/avatar.jpg`, buffer, {
--       contentType: 'image/jpeg',
--       upsert: true
--     });
--
--   const { data: { publicUrl } } = supabaseAdmin.storage
--     .from('avatars')
--     .getPublicUrl(`${firebaseUid}/avatar.jpg`);
--
--   // Then upsert into profile_pictures with storage_url = publicUrl
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- SUMMARY OF ALL TABLES
-- ─────────────────────────────────────────────────────────────
-- From v1   : profiles, files, audit_logs, devices
-- From v2   : favorites, vault_items
-- From v3   : team_spaces, team_space_members, projects, file_tags, shared_links
-- New in v4 : 🆕 profile_pictures
-- ─────────────────────────────────────────────────────────────
