/**
 * Supabase data-access helpers.
 *
 * Every function takes the Firebase user's `uid` explicitly and filters by
 * the firebase_uid column — there is no Supabase session to read it from.
 */

import { supabase } from './supabase';
import type { User } from './firebase';

/**
 * Call this right after a successful Firebase login/signup. Creates the
 * `profiles` row for this user if it doesn't exist yet, and returns it.
 */
export async function ensureProfile(user: User) {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', user.uid)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      firebase_uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'New User',
      email: user.email || '',
      role: 'User',
      status: 'Active',
      storage_used: 0,
      storage_limit: 5368709120,
      mfa_enabled: false
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

export async function getFiles(firebaseUid: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getServers(firebaseUid: string) {
  const { data, error } = await supabase.from('servers').select('*').eq('firebase_uid', firebaseUid);
  if (error) throw error;
  return data;
}

export async function getAlerts(firebaseUid: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAuditLogs(firebaseUid: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getWebhooks(firebaseUid: string) {
  const { data, error } = await supabase.from('webhooks').select('*').eq('firebase_uid', firebaseUid);
  if (error) throw error;
  return data;
}

export async function getDevices(firebaseUid: string) {
  const { data, error } = await supabase.from('devices').select('*').eq('firebase_uid', firebaseUid);
  if (error) throw error;
  return data;
}
