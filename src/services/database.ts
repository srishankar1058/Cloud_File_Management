/**
 * services/database.ts
 *
 * Persistence strategy (two-layer):
 *
 *   LAYER 1 — localStorage (always on, instant)
 *     Every write goes to localStorage first, scoped by uid.
 *     This means files survive page reload even if the server is down.
 *
 *   LAYER 2 — Express proxy → Supabase (fire-and-forget)
 *     If a Firebase ID token is available, we also sync to the server.
 *     Server failures are swallowed — localStorage is already updated.
 *
 * On LOAD (loadWorkspace):
 *   1. Read localStorage immediately → show files instantly.
 *   2. If server is reachable, fetch remote → merge with local
 *      (remote wins for any item that exists in both).
 *   3. Write merged result back to localStorage so next reload is fast.
 */

import { getFirebaseAuth } from './firebase';
import type { AuditLog, DeviceItem, FileItem, UserAccount } from '../types';

// ─── Token helper ──────────────────────────────────────────────────────────────

async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(false);
  } catch {
    return null;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── Server-proxy fetch ────────────────────────────────────────────────────────

const BASE = '/api/workspace';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
    ...(init.headers as Record<string, string> | undefined ?? {})
  };
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── localStorage helpers (Layer 1 — always used) ────────────────────────────

type WorkspaceTable = 'files' | 'audit_logs' | 'devices';

const lsKey = (userId: string, table: string) => `omnidrive:${userId}:${table}`;

/** Read all items for a table from localStorage. Returns [] on any error. */
export const lsGetAll = <T>(userId: string, table: string): T[] => {
  try {
    const raw = localStorage.getItem(lsKey(userId, table));
    if (!raw) return [];
    return Object.values(JSON.parse(raw) as Record<string, T>);
  } catch {
    return [];
  }
};

/** Upsert a single item in localStorage by its `id` field. */
export const lsUpsert = <T extends { id: string }>(userId: string, table: string, item: T): void => {
  try {
    const raw = localStorage.getItem(lsKey(userId, table));
    const obj: Record<string, T> = raw ? JSON.parse(raw) : {};
    obj[item.id] = item;
    localStorage.setItem(lsKey(userId, table), JSON.stringify(obj));
  } catch (e) {
    // Quota exceeded — try stripping dataUrls from binary files to save space
    if (table === 'files') {
      try {
        const raw2 = localStorage.getItem(lsKey(userId, table));
        const obj: Record<string, any> = raw2 ? JSON.parse(raw2) : {};
        // Save without the large dataUrl for this item (keeps metadata)
        obj[item.id] = { ...(item as any), dataUrl: '[binary-stripped]' };
        localStorage.setItem(lsKey(userId, table), JSON.stringify(obj));
      } catch {}
    }
  }
};

/** Delete one item from localStorage. */
export const lsDelete = (userId: string, table: string, itemId: string): void => {
  try {
    const raw = localStorage.getItem(lsKey(userId, table));
    if (!raw) return;
    const obj: Record<string, unknown> = JSON.parse(raw);
    delete obj[itemId];
    localStorage.setItem(lsKey(userId, table), JSON.stringify(obj));
  } catch {}
};

/** Read user profile from localStorage. */
export const lsGetProfile = (userId: string): UserAccount | undefined => {
  try {
    const raw = localStorage.getItem(lsKey(userId, 'profile'));
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

/** Write user profile to localStorage. */
export const lsSaveProfile = (profile: UserAccount): void => {
  try {
    localStorage.setItem(lsKey(profile.id, 'profile'), JSON.stringify(profile));
  } catch {}
};

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Save an item.
 *   1. Always writes to localStorage immediately.
 *   2. Fire-and-forget sync to server if token available.
 */
export const saveWorkspaceItem = async <T extends { id: string }>(
  table: WorkspaceTable,
  userId: string,
  item: T
): Promise<void> => {
  // Layer 1: localStorage — always, immediately
  lsUpsert(userId, table, item);

  // Layer 2: server — best effort
  const token = await getIdToken();
  if (!token) return;
  apiFetch(`/${table}/${encodeURIComponent(item.id)}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  }).catch(() => { /* server down — localStorage already updated */ });
};

/**
 * Delete an item.
 *   1. Remove from localStorage immediately.
 *   2. Fire-and-forget delete on server.
 */
export const deleteWorkspaceItem = async (
  table: WorkspaceTable,
  userId: string,
  itemId: string
): Promise<void> => {
  // Layer 1
  lsDelete(userId, table, itemId);

  // Layer 2
  const token = await getIdToken();
  if (!token) return;
  apiFetch(`/${table}/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
    .catch(() => {});
};

/**
 * Save user profile.
 *   1. localStorage immediately.
 *   2. Server best-effort.
 */
export const saveUserProfile = async (profile: UserAccount): Promise<void> => {
  // Layer 1
  lsSaveProfile(profile);

  // Layer 2
  const token = await getIdToken();
  if (!token) return;
  apiFetch('/profile/me', {
    method: 'PUT',
    body: JSON.stringify(profile)
  }).catch(() => {});
};

/**
 * Load workspace.
 *
 * Strategy:
 *   1. Read localStorage immediately → provides instant data on reload.
 *   2. Attempt server fetch (if token available).
 *   3. Merge: remote items win by id (more recent source of truth).
 *   4. Write merged result back to localStorage.
 */
export const loadWorkspace = async (userId: string) => {
  // Step 1: local data (instant, always available)
  const localFiles      = lsGetAll<FileItem>(userId, 'files');
  const localAuditLogs  = lsGetAll<AuditLog>(userId, 'audit_logs');
  const localDevices    = lsGetAll<DeviceItem>(userId, 'devices');
  const localProfile    = lsGetProfile(userId);

  let files      = localFiles;
  let auditLogs  = localAuditLogs;
  let devices    = localDevices;
  let profile    = localProfile;

  // Step 2: try server
  try {
    const token = await getIdToken();
    if (token) {
      const [remoteFilesRes, remoteLogsRes, remoteDevicesRes, remoteProfileRes] =
        await Promise.all([
          apiFetch<{ items: FileItem[] }>('/files').catch(() => null),
          apiFetch<{ items: AuditLog[] }>('/audit_logs').catch(() => null),
          apiFetch<{ items: DeviceItem[] }>('/devices').catch(() => null),
          apiFetch<{ profile: UserAccount | null }>('/profile/me').catch(() => null),
        ]);

      // Step 3: merge — remote wins by id
      if (remoteFilesRes?.items?.length) {
        const merged: Record<string, FileItem> = {};
        localFiles.forEach(f => { merged[f.id] = f; });
        remoteFilesRes.items.forEach(f => { merged[f.id] = f; });
        files = Object.values(merged);
      }
      if (remoteLogsRes?.items?.length) {
        const merged: Record<string, AuditLog> = {};
        localAuditLogs.forEach(l => { merged[l.id] = l; });
        remoteLogsRes.items.forEach(l => { merged[l.id] = l; });
        auditLogs = Object.values(merged).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
      if (remoteDevicesRes?.items?.length) {
        devices = remoteDevicesRes.items;
      }
      if (remoteProfileRes?.profile) {
        profile = remoteProfileRes.profile;
      }

      // Step 4: write merged back to localStorage so next reload is instant
      const fileMap: Record<string, FileItem> = {};
      files.forEach(f => { fileMap[f.id] = f; });
      try { localStorage.setItem(lsKey(userId, 'files'), JSON.stringify(fileMap)); } catch {}

      const logMap: Record<string, AuditLog> = {};
      auditLogs.forEach(l => { logMap[l.id] = l; });
      try { localStorage.setItem(lsKey(userId, 'audit_logs'), JSON.stringify(logMap)); } catch {}

      if (profile) lsSaveProfile(profile);
    }
  } catch {
    // Server unavailable — use localStorage data already loaded in Step 1
  }

  return { profile, files, auditLogs, devices };
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportUserData = async (userId: string): Promise<void> => {
  const { profile, files, auditLogs, devices } = await loadWorkspace(userId);
  const payload = {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile ?? null,
    files,
    auditLogs,
    devices
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omnidrive-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
