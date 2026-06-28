/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UserAccount, AuditLog, DeviceItem, Theme } from '../types';
import {
  User as UserIcon, Camera, Shield, Key, Activity,
  CheckCircle2, AlertTriangle, ShieldAlert, Sun, Moon, HardDrive
} from 'lucide-react';

interface SettingsPageProps {
  user: UserAccount;
  auditLogs: AuditLog[];
  devices: DeviceItem[];
  theme: Theme;
  onToggleTheme: () => void;
  onToggleMFA: () => void;
  onRemoveDevice: (deviceId: string) => void;
  onUpdateName: (name: string) => void;
  onUpdateAvatar: (dataUrl: string) => void;
}

export default function SettingsPage({
  user,
  auditLogs,
  theme,
  onToggleTheme,
  onToggleMFA,
  onUpdateName,
  onUpdateAvatar
}: SettingsPageProps) {
  const [nameDraft, setNameDraft] = useState(user.name);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initials = user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const storageLimitGB = (user.storageLimit / (1024 * 1024 * 1024)).toFixed(0);
  const storageUsedGB = (user.storageUsed / (1024 * 1024 * 1024)).toFixed(2);
  const storagePercent = Math.round((user.storageUsed / user.storageLimit) * 100);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onUpdateAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleNameBlur = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== user.name) {
      onUpdateName(trimmed);
    } else {
      setNameDraft(user.name);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col h-[calc(100vh-4rem)] text-slate-700 dark:text-slate-200 overflow-y-auto select-none">
      <div className="max-w-4xl w-full mx-auto space-y-6">

        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your profile, appearance, security, and account activity.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Profile</h3>
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-2xl">
                  {initials}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 transition-colors"
                title="Change profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Display name</label>
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="w-full max-w-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Email</label>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-mono">{user.email}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Role</label>
                <p className="text-sm text-slate-600 dark:text-slate-300">{user.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-blue-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Applies across the whole workspace.
                </p>
              </div>
            </div>
            <button
              onClick={onToggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Security
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Multi-Factor Authentication</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  user.mfaEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Adds a verification step when signing in from a new device.
              </p>
            </div>
            <button
              onClick={onToggleMFA}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                user.mfaEnabled
                  ? 'bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {user.mfaEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600" />
            Storage
          </h3>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{storageUsedGB} GB of {storageLimitGB} GB used</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mt-3">
            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${storagePercent}%` }} />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{storagePercent}% of your storage plan is used.</p>
        </div>

        {/* Activity log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            Account Activity
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[11px]">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 font-sans">No activity recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-3">
                  <div className="mt-0.5">
                    {log.status === 'Success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : log.status === 'Warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-[10px]">
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">[{log.user}]</span>
                      <span className="text-slate-500 dark:text-slate-400 font-bold ml-1.5">{log.action}:</span>
                      <span className="text-slate-700 dark:text-slate-300 ml-1.5 leading-relaxed">{log.details}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
