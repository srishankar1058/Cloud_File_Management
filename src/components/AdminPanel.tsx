/**
 * AdminPanel.tsx
 *
 * Live admin dashboard — user list, per-user uploaded data, activity logs,
 * platform statistics, and live auto-refresh (every 30 s).
 *
 * Access: only rendered when the current user's UID is in ADMIN_UIDS env var
 * (the server enforces this too; the component just provides the UI).
 *
 * Usage in App.tsx:
 *   import AdminPanel from './components/AdminPanel';
 *   // Render conditionally when user.uid is an admin
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  HardDrive,
  Layers,
  RefreshCw,
  Server,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { getFirebaseAuth } from '../services/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  uid: string;
  email: string;
  profile: Record<string, unknown> | null;
  updatedAt: string;
  stats: { files: number; auditLogs: number; devices: number };
}

interface Stats {
  totals: { users: number; files: number; auditLogs: number; devices: number };
  recentActivity: { userId: string; log: Record<string, unknown>; at: string }[];
  serverTime: string;
}

interface UserData {
  uid: string;
  profile: Record<string, unknown> | null;
  files: unknown[];
  auditLogs: unknown[];
  devices: unknown[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function adminFetch<T>(path: string): Promise<T> {
  const auth = getFirebaseAuth();
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
  const res = await fetch(`/api/admin${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function UserDetailModal({ uid, onClose }: { uid: string; onClose: () => void }) {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'files' | 'audit' | 'devices'>('files');

  useEffect(() => {
    adminFetch<UserData>(`/users/${uid}/data`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [uid]);

  const downloadUserData = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidrive-admin-export-${uid}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: typeof tab; label: string; count: number }[] = data
    ? [
        { key: 'files', label: 'Files', count: data.files.length },
        { key: 'audit', label: 'Audit Logs', count: data.auditLogs.length },
        { key: 'devices', label: 'Devices', count: data.devices.length }
      ]
    : [];

  const rows = data
    ? tab === 'files' ? data.files : tab === 'audit' ? data.auditLogs : data.devices
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">User Data</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{uid}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadUserData}
              disabled={!data}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center text-slate-500">Loading…</div>
          )}
          {error && (
            <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>
          )}
          {data && (
            <>
              {/* Profile summary */}
              {data.profile && (
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-medium">
                    {(data.profile.name as string) || 'Unknown'}
                  </span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span>{(data.profile.email as string) || ''}</span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="text-slate-500">
                    Role: {(data.profile.role as string) || '—'}
                  </span>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700 px-6">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      tab === t.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {t.label}
                    <span className="ml-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {rows.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No records</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        {Object.keys(rows[0] as object)
                          .slice(0, 5)
                          .map(k => (
                            <th key={k} className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {k}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {Object.values(row as object)
                            .slice(0, 5)
                            .map((v, j) => (
                              <td key={j} className="px-4 py-2 text-slate-700 dark:text-slate-300 font-mono text-xs truncate max-w-[200px]">
                                {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'activity'>('stats');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminFetch<{ users: UserRow[]; total: number }>('/users'),
        adminFetch<Stats>('/stats')
      ]);
      setUsers(usersRes.users);
      setStats(statsRes);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    refreshTimer.current = setInterval(load, 30_000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [load]);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Admin Panel</h2>
            <p className="text-xs text-slate-400">
              Last refresh: {lastRefresh.toLocaleTimeString()} · Auto-refresh every 30 s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-6 py-2 bg-red-900/80 text-red-200 text-sm border-b border-red-800 shrink-0">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 shrink-0">
        {([
          { key: 'stats', label: 'Statistics', icon: BarChart2 },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'activity', label: 'Activity', icon: Activity }
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {/* ── Statistics ─────────────────────────────── */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.totals.users} icon={Users} color="bg-blue-600" />
              <StatCard label="Total Files" value={stats.totals.files} icon={FileText} color="bg-violet-600" />
              <StatCard label="Audit Logs" value={stats.totals.auditLogs} icon={Layers} color="bg-emerald-600" />
              <StatCard label="Devices" value={stats.totals.devices} icon={HardDrive} color="bg-orange-500" />
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
                <Server className="w-4 h-4" /> Server Status
              </h3>
              <p className="text-slate-400 text-sm">
                Server time: <span className="text-white font-mono">{fmtDate(stats.serverTime)}</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Users ──────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-2">
            {users.length === 0 && !loading && (
              <div className="text-slate-500 text-sm text-center py-12">No users found</div>
            )}
            {users.map(u => (
              <div
                key={u.uid}
                className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-750 text-left"
                  onClick={() => setExpandedUser(expandedUser === u.uid ? null : u.uid)}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {(u.profile?.name as string)?.[0]?.toUpperCase() ||
                      u.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {(u.profile?.name as string) || u.email || u.uid}
                    </p>
                    <p className="text-slate-400 text-xs truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400">
                    <span title="Files">{u.stats.files} files</span>
                    <span title="Logs">{u.stats.auditLogs} logs</span>
                    <span title="Devices">{u.stats.devices} devices</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedUid(u.uid); }}
                    className="ml-2 px-2 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-md transition-colors"
                  >
                    View data
                  </button>
                  {expandedUser === u.uid
                    ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                </button>

                {expandedUser === u.uid && (
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-700 pt-3">
                    <div className="text-slate-400">UID</div>
                    <div className="text-slate-200 font-mono truncate">{u.uid}</div>
                    <div className="text-slate-400">Role</div>
                    <div className="text-slate-200">{(u.profile?.role as string) || '—'}</div>
                    <div className="text-slate-400">Status</div>
                    <div className="text-slate-200">{(u.profile?.status as string) || '—'}</div>
                    <div className="text-slate-400">Last active</div>
                    <div className="text-slate-200">{fmtDate(u.updatedAt)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Activity ────────────────────────────────── */}
        {activeTab === 'activity' && stats && (
          <div className="space-y-2">
            {stats.recentActivity.length === 0 && (
              <div className="text-slate-500 text-sm text-center py-12">No recent activity</div>
            )}
            {stats.recentActivity.map((a, i) => {
              const log = a.log as Record<string, unknown>;
              return (
                <div
                  key={i}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      {(log.action as string) || 'Unknown action'}
                      {log.details ? (
                        <span className="text-slate-400 ml-1">— {log.details as string}</span>
                      ) : null}
                    </p>
                    <div className="flex gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono truncate max-w-[160px]">{a.userId}</span>
                      <span>·</span>
                      <span>{fmtDate(a.at)}</span>
                      {log.status && (
                        <>
                          <span>·</span>
                          <span className={
                            log.status === 'Success' ? 'text-emerald-400'
                            : log.status === 'Failed' ? 'text-red-400'
                            : 'text-yellow-400'
                          }>
                            {log.status as string}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading…
          </div>
        )}
      </div>

      {/* User detail modal */}
      {selectedUid && (
        <UserDetailModal uid={selectedUid} onClose={() => setSelectedUid(null)} />
      )}
    </div>
  );
}
