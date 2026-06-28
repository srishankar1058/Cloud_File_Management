/**
 * Supabase client.
 *
 * Add these to your .env file:
 *
 *   VITE_SUPABASE_URL=
 *   VITE_SUPABASE_ANON_KEY=
 *
 * Auth is handled entirely by Firebase (see firebase.ts). Supabase here is
 * used purely as the data store: every table is keyed by the Firebase UID
 * (a plain text column, NOT Supabase's own auth.uid()). Row Level Security
 * is therefore enforced via the anon key + the firebase_uid column rather
 * than Supabase Auth — see supabase_schema.sql for the policies, and
 * supabaseData.ts for the read/write helpers that pass the current
 * Firebase user's uid on every call.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
