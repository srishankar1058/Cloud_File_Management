/**
 * services/vault.ts
 *
 * Client-side AES-GCM encryption/decryption for vault items.
 * The server stores only ciphertext — it never sees the plaintext or the password.
 *
 * Crypto scheme:
 *   Key  = PBKDF2(password, salt, 200_000 iterations, SHA-256) → AES-256-GCM key
 *   Enc  = AES-GCM(key, iv, plaintext)
 *   Stored: { id, name, encrypted_content (base64), salt (base64), iv (base64), password_hint? }
 */

import { getFirebaseAuth } from './firebase';

// ─── Crypto helpers ───────────────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 200_000;

function buf2b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b642buf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptContent(
  plaintext: string,
  password: string
): Promise<{ encrypted_content: string; salt: string; iv: string }> {
  const saltBuf = crypto.getRandomValues(new Uint8Array(16)).buffer;
  const ivBuf   = crypto.getRandomValues(new Uint8Array(12)).buffer;
  const key = await deriveKey(password, saltBuf);
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuf },
    key,
    enc.encode(plaintext)
  );
  return {
    encrypted_content: buf2b64(cipherBuf),
    salt: buf2b64(saltBuf),
    iv:   buf2b64(ivBuf)
  };
}

export async function decryptContent(
  encrypted_content: string,
  salt: string,
  iv: string,
  password: string
): Promise<string> {
  const key = await deriveKey(password, b642buf(salt));
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b642buf(iv) },
    key,
    b642buf(encrypted_content)
  );
  return new TextDecoder().decode(plainBuf);
}

// ─── Vault API helpers ────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export interface VaultItem {
  id: string;
  name: string;
  encrypted_content: string;
  salt: string;
  iv: string;
  password_hint?: string | null;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export async function fetchVaultItems(): Promise<VaultItem[]> {
  const res = await fetch('/api/vault', { headers: await authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
  const data = await res.json();
  return data.items as VaultItem[];
}

export async function saveVaultItem(item: Omit<VaultItem, 'created_at' | 'updated_at'>): Promise<void> {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
}

export async function deleteVaultItem(id: string): Promise<void> {
  const res = await fetch(`/api/vault/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders()
  });
  if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
}

// ─── Favorites API helpers ────────────────────────────────────────────────────
// Falls back to localStorage when the server API is unavailable (no Firebase
// service account configured, demo mode, etc.) so favorites always persist.

const LS_FAV_KEY = (uid: string) => `omnidrive:${uid}:favorites`;

function lsGetFavs(uid: string): Set<string> {
  try {
    const raw = localStorage.getItem(LS_FAV_KEY(uid));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function lsSaveFavs(uid: string, ids: Set<string>): void {
  try { localStorage.setItem(LS_FAV_KEY(uid), JSON.stringify([...ids])); } catch {}
}

async function currentUid(): Promise<string | null> {
  const auth = getFirebaseAuth();
  return auth?.currentUser?.uid ?? null;
}

export async function fetchFavoriteIds(): Promise<Set<string>> {
  const uid = await currentUid();
  if (!uid) return new Set();
  try {
    const res = await fetch('/api/favorites', { headers: await authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ids = new Set(data.fileIds as string[]);
    // Merge with any locally-stored ids so nothing is lost
    lsGetFavs(uid).forEach(id => ids.add(id));
    lsSaveFavs(uid, ids);
    return ids;
  } catch {
    console.warn('[OmniDrive] Favorites API unavailable — using localStorage.');
    return lsGetFavs(uid);
  }
}

export async function toggleFavoriteRemote(fileId: string): Promise<'added' | 'removed'> {
  const uid = await currentUid();
  if (!uid) return 'removed';

  // Always update localStorage immediately as the source of truth
  const current = lsGetFavs(uid);
  let action: 'added' | 'removed';
  if (current.has(fileId)) {
    current.delete(fileId);
    action = 'removed';
  } else {
    current.add(fileId);
    action = 'added';
  }
  lsSaveFavs(uid, current);

  // Best-effort sync to server (fire-and-forget — localStorage is the fallback)
  try {
    const res = await fetch(`/api/favorites/${encodeURIComponent(fileId)}`, {
      method: 'POST',
      headers: await authHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.action as 'added' | 'removed';
  } catch {
    // Server unavailable — localStorage already updated above
    return action;
  }
}
