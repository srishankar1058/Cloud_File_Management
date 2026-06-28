/**
 * PersonalVault.tsx
 *
 * Password-protected vault. All encryption/decryption is done in the browser
 * with AES-GCM + PBKDF2. The server only stores ciphertext.
 *
 * Features:
 *  - Add item: enter name, content, password, optional hint → encrypted & saved
 *  - View item: enter password → decrypted content shown in modal
 *  - Delete item
 *  - Fully persisted to Supabase via /api/vault (server-proxy, no anon key)
 *  - localStorage fallback when server is unavailable
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Copy, Eye, EyeOff, KeyRound, Loader2, Lock, Plus, ShieldCheck, Trash2, X
} from 'lucide-react';
import {
  decryptContent,
  deleteVaultItem,
  encryptContent,
  fetchVaultItems,
  saveVaultItem,
  type VaultItem
} from '../services/vault';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

// ─── Local storage fallback ───────────────────────────────────────────────────

const LS_KEY = (uid: string) => `omnidrive:vault:${uid}`;

function lsLoadVault(uid: string): VaultItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsSaveVault(uid: string, items: VaultItem[]): void {
  try { localStorage.setItem(LS_KEY(uid), JSON.stringify(items)); } catch {}
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  dm: Record<string, string>;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, msg?: string) => void;
}

// ─── Decrypt Modal ────────────────────────────────────────────────────────────

function DecryptModal({
  item,
  onClose,
  dm
}: {
  item: VaultItem;
  onClose: () => void;
  dm: Record<string, string>;
}) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const plain = await decryptContent(item.encrypted_content, item.salt, item.iv, password);
      setDecrypted(plain);
    } catch {
      setError('Wrong password or corrupted data.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!decrypted) return;
    await navigator.clipboard.writeText(decrypted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full max-w-lg rounded-3xl border ${dm.border} ${dm.bg} shadow-2xl overflow-hidden`}>
        <div className={`flex items-center justify-between border-b ${dm.border} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className={`text-sm font-semibold ${dm.text}`}>{item.name}</h2>
              <p className={`text-xs ${dm.textMuted}`}>{formatBytes(item.size_bytes)} · {fmtDate(item.updated_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className={`rounded-xl p-2 ${dm.textMuted} ${dm.hover}`}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!decrypted ? (
            <form onSubmit={handleDecrypt} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${dm.textSub} mb-2`}>
                  Enter vault password
                </label>
                {item.password_hint && (
                  <p className={`mb-3 text-xs ${dm.textMuted} rounded-xl bg-amber-50 dark:bg-amber-950 px-3 py-2 border border-amber-200 dark:border-amber-800`}>
                    💡 Hint: {item.password_hint}
                  </p>
                )}
                <div className="relative">
                  <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${dm.textMuted} pointer-events-none`} />
                  <input
                    ref={inputRef}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Vault password"
                    className={`h-11 w-full rounded-2xl border ${dm.border} ${dm.bg} pl-10 pr-12 text-sm ${dm.text} outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 ${dm.textMuted} ${dm.hover}`}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Unlock
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${dm.textSub}`}>Decrypted content</p>
                <button
                  onClick={copy}
                  className={`flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-1.5 ${dm.hover} ${copied ? 'text-emerald-600' : 'text-blue-600'}`}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre
                className={`max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border ${dm.border} ${dm.bgMuted} p-4 text-sm ${dm.text} font-mono`}
              >
                {decrypted}
              </pre>
              <button
                onClick={() => { setDecrypted(null); setPassword(''); }}
                className={`text-sm font-semibold ${dm.textMuted} hover:text-slate-700 dark:hover:text-white`}
              >
                Lock again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PersonalVault({ userId, dm, showToast }: Props) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverAvailable, setServerAvailable] = useState(true);

  // Add form
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [hint, setHint] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // View modal
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);

  // ── Load vault items ────────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await fetchVaultItems();
      setItems(remote);
      setServerAvailable(true);
      lsSaveVault(userId, remote); // keep local cache in sync
    } catch (err) {
      console.warn('Vault remote load failed, using localStorage', err);
      setItems(lsLoadVault(userId));
      setServerAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  // ── Save new vault item ─────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError('Name is required.'); return; }
    if (!content.trim()) { setFormError('Content is required.'); return; }
    if (!password) { setFormError('Password is required.'); return; }
    if (password !== confirmPw) { setFormError('Passwords do not match.'); return; }

    setSaving(true);
    try {
      const { encrypted_content, salt, iv } = await encryptContent(content, password);
      const newItem = {
        id: `vault-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        encrypted_content,
        salt,
        iv,
        password_hint: hint.trim() || null,
        size_bytes: new TextEncoder().encode(content).byteLength
      };

      if (serverAvailable) {
        await saveVaultItem(newItem);
      }

      const withDates: VaultItem = {
        ...newItem,
        password_hint: newItem.password_hint ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const next = [withDates, ...items];
      setItems(next);
      lsSaveVault(userId, next);

      // Reset form
      setName(''); setContent(''); setPassword(''); setConfirmPw(''); setHint('');
      showToast('success', 'Saved to Vault', name.trim());
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
      showToast('error', 'Vault save failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete vault item ───────────────────────────────────────────────────────
  const handleDelete = async (item: VaultItem) => {
    try {
      if (serverAvailable) await deleteVaultItem(item.id);
      const next = items.filter(i => i.id !== item.id);
      setItems(next);
      lsSaveVault(userId, next);
      showToast('warning', 'Removed from Vault', item.name);
    } catch (err: any) {
      showToast('error', 'Delete failed', err.message);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-semibold ${dm.text}`}>Personal Vault</h1>
            <p className={`mt-2 text-sm ${dm.textMuted}`}>
              End-to-end encrypted storage — contents are encrypted in your browser before leaving your device.
            </p>
          </div>
          {!serverAvailable && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              Offline mode — saving locally
            </span>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          {/* ── Add form ─────────────────────────────────────────────────── */}
          <section className={`rounded-3xl border ${dm.border} ${dm.bg} p-6 shadow-sm`}>
            <h2 className={`flex items-center gap-2 text-base font-semibold ${dm.text}`}>
              <Plus className="h-4 w-4 text-blue-600" />
              Add Secure Item
            </h2>
            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <label className={`block text-sm font-medium ${dm.textSub}`}>
                Name
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="api-keys.txt, db-credentials, SSH key…"
                  className={`mt-1.5 h-11 w-full rounded-2xl border ${dm.border} ${dm.bg} px-3 text-sm ${dm.text} outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900`}
                />
              </label>

              <label className={`block text-sm font-medium ${dm.textSub}`}>
                Content
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste sensitive notes, keys, or credentials here…"
                  className={`mt-1.5 h-32 w-full rounded-2xl border ${dm.border} ${dm.bg} p-3 text-sm ${dm.text} outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900`}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={`block text-sm font-medium ${dm.textSub}`}>
                  Password
                  <div className="relative mt-1.5">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Vault password"
                      className={`h-11 w-full rounded-2xl border ${dm.border} ${dm.bg} px-3 pr-10 text-sm ${dm.text} outline-none focus:border-blue-500`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg ${dm.textMuted} ${dm.hover}`}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
                <label className={`block text-sm font-medium ${dm.textSub}`}>
                  Confirm password
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Repeat password"
                    className={`mt-1.5 h-11 w-full rounded-2xl border ${dm.border} ${dm.bg} px-3 text-sm ${dm.text} outline-none focus:border-blue-500`}
                  />
                </label>
              </div>

              <label className={`block text-sm font-medium ${dm.textSub}`}>
                Password hint <span className={`font-normal ${dm.textMuted}`}>(optional, stored in plaintext)</span>
                <input
                  value={hint}
                  onChange={e => setHint(e.target.value)}
                  placeholder="e.g. first pet's name"
                  className={`mt-1.5 h-11 w-full rounded-2xl border ${dm.border} ${dm.bg} px-3 text-sm ${dm.text} outline-none focus:border-blue-500`}
                />
              </label>

              {formError && (
                <p className="text-sm text-red-500 rounded-xl bg-red-50 dark:bg-red-950 px-3 py-2 border border-red-200 dark:border-red-800">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-600 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {saving ? 'Encrypting…' : 'Encrypt & Save'}
              </button>
            </form>
          </section>

          {/* ── Vault items list ─────────────────────────────────────────── */}
          <section className={`rounded-3xl border ${dm.border} ${dm.bg} p-6 shadow-sm`}>
            <h2 className={`flex items-center gap-2 text-base font-semibold ${dm.text}`}>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Vault Items
              <span className={`ml-1 text-sm font-normal ${dm.textMuted}`}>({items.length})</span>
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className={`h-6 w-6 animate-spin ${dm.textMuted}`} />
              </div>
            ) : items.length === 0 ? (
              <div className={`mt-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center`}>
                <Lock className={`mx-auto h-8 w-8 ${dm.textMuted}`} />
                <p className={`mt-3 text-sm font-semibold ${dm.text}`}>No vault items yet</p>
                <p className={`mt-1 text-sm ${dm.textMuted}`}>Add credentials, keys, or private notes above.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 rounded-2xl border ${dm.border} p-4 transition ${dm.hover}`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                      <Lock className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-semibold ${dm.text}`}>{item.name}</p>
                      <p className={`text-xs ${dm.textMuted} mt-0.5`}>
                        {formatBytes(item.size_bytes)} · {fmtDate(item.updated_at)}
                        {item.password_hint && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400">· hint set</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setViewingItem(item)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors`}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Unlock
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Security note */}
        <div className={`rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-200`}>
          <p className="font-semibold">🔐 How encryption works</p>
          <p className={`mt-1 ${dm.textMuted}`}>
            Your content is encrypted in the browser using AES-256-GCM before it leaves your device.
            The server stores only ciphertext — your password never leaves your browser.
            If you forget the password, the content cannot be recovered.
          </p>
        </div>
      </div>

      {/* Decrypt modal */}
      {viewingItem && (
        <DecryptModal item={viewingItem} onClose={() => setViewingItem(null)} dm={dm} />
      )}
    </main>
  );
}
