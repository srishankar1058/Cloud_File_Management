/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, FileItem, ServerInstance, AlertNotification, AuditLog, DeviceItem } from '../types';
import { Clock, Users, Star, HardDrive, Upload, FolderPlus, X } from 'lucide-react';

interface HomeDashboardProps {
  user: UserAccount;
  files: FileItem[];
  servers: ServerInstance[];
  alerts: AlertNotification[];
  auditLogs: AuditLog[];
  devices: DeviceItem[];
  favoriteIds?: Set<string>;
  onNavigateTab: (tab: string) => void;
  onOpenEditor: (file: FileItem) => void;
  onCreateFolder?: (name: string) => void;
  onUpload?: () => void;
}

/**
 * Format storage percentage accurately:
 * - 0 bytes        → "0%"
 * - < 1%           → e.g. "0.02%" (two significant decimals)
 * - 1–99%          → "X%" (integer)
 * - 100%           → "100%"
 */
function formatStoragePercent(usedBytes: number, limitBytes: number): string {
  if (usedBytes <= 0) return '0%';
  const pct = (usedBytes / limitBytes) * 100;
  if (pct < 1) return `${parseFloat(pct.toFixed(2))}%`;
  return `${Math.round(pct)}%`;
}

export default function HomeDashboard({
  user,
  files,
  servers,
  alerts,
  auditLogs,
  devices,
  favoriteIds = new Set(),
  onNavigateTab,
  onOpenEditor,
  onCreateFolder,
  onUpload,
}: HomeDashboardProps) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');

  const recentFiles = [...files]
    .filter(f => !f.isDeleted && f.type !== 'folder')
    .slice(0, 5);

  const sharedFiles = files.filter(
    f => !f.isDeleted && (f.sharing === 'Shared' || f.sharing === 'Public' || f.sharing === 'Team')
  );

  const favoriteFiles = files.filter(f => !f.isDeleted && favoriteIds.has(f.id));

  const storageLimitGB = (user.storageLimit / (1024 * 1024 * 1024)).toFixed(0);

  // Accurate percent label (never rounds to 0 if files exist)
  const storagePercentLabel = formatStoragePercent(user.storageUsed, user.storageLimit);

  // Used for colour thresholds (integer)
  const storagePercentRaw = Math.round((user.storageUsed / user.storageLimit) * 100);

  // Format used storage: show MB when small, GB when large
  const storageUsedBytes = user.storageUsed;
  const storageUsedLabel = storageUsedBytes >= 1024 * 1024 * 1024
    ? `${(storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    : storageUsedBytes >= 1024 * 1024
      ? `${(storageUsedBytes / (1024 * 1024)).toFixed(1)} MB`
      : storageUsedBytes >= 1024
        ? `${(storageUsedBytes / 1024).toFixed(1)} KB`
        : `${storageUsedBytes} B`;

  // Raw ratio for arc/bar fill (0–1, clamped)
  const storageRatio = Math.min(1, user.storageUsed / user.storageLimit);

  const storageBarColor =
    storagePercentRaw >= 90 ? '#EF4444' :
    storagePercentRaw >= 70 ? '#F59E0B' :
    '#3B82F6';

  const storageBarGlow =
    storagePercentRaw >= 90 ? 'rgba(239,68,68,0.4)' :
    storagePercentRaw >= 70 ? 'rgba(245,158,11,0.4)' :
    'rgba(59,130,246,0.4)';

  const storageDonutColor = storageBarColor;

  // Minimum visible arc: at least 2% of circumference so tiny usage is still visible
  const circumference = 2 * Math.PI * 48;
  const donutFill = storageUsedBytes > 0 ? Math.max(storageRatio, 0.02) : 0;

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'image') return '🖼️';
    if (file.extension === 'json' || file.type === 'config') return '⚙️';
    if (file.extension === 'sh'   || file.type === 'log')    return '📜';
    return '📄';
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    if (onCreateFolder) onCreateFolder(name);
    onNavigateTab('files');
    setFolderName('');
    setShowFolderModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto select-none page-enter">
      {/* Create Folder Modal */}
      {showFolderModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[200] p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <form onSubmit={handleCreateFolderSubmit}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Folder</h3>
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 pb-4">
                <input
                  type="text"
                  required
                  placeholder="Enter folder name..."
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>
              <div className="px-5 py-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setShowFolderModal(false); setFolderName(''); }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-white rounded-lg text-xs font-semibold"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', border: 'none', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent-primary)' }}>
              Good to see you, {user.name.split(' ')[0]}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Your business file workspace
            </h1>
            <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
              Access recent documents, team folders, shared files, and storage insights.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onUpload ?? (() => onNavigateTab('files'))}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                borderRadius: '10px',
                border: 'none',
                boxShadow: '0 2px 12px rgba(99,102,241,0.3)'
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => setShowFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700"
            >
              <FolderPlus className="w-4 h-4" />
              Create Folder
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              tab: 'recent', icon: <Clock className="w-5 h-5 text-blue-500" />,
              iconBg: 'rgba(59,130,246,0.1)', value: recentFiles.length, label: 'Recent files'
            },
            {
              tab: 'shared', icon: <Users className="w-5 h-5 text-teal-500" />,
              iconBg: 'rgba(20,184,166,0.1)', value: sharedFiles.length, label: 'Shared items'
            },
            {
              tab: 'favorites', icon: <Star className="w-5 h-5 text-amber-400" />,
              iconBg: 'rgba(245,158,11,0.1)', value: favoriteFiles.length, label: 'Favourites'
            },
            {
              tab: 'settings-tab', icon: <HardDrive className="w-5 h-5 text-slate-500 dark:text-slate-400" />,
              iconBg: 'rgba(99,102,241,0.08)', value: storagePercentLabel, label: 'Storage used'
            },
          ].map((card) => (
            <div
              key={card.tab}
              onClick={() => onNavigateTab(card.tab)}
              className="flex items-center gap-4 cursor-pointer p-5 transition-all rounded-2xl bg-white/55 dark:bg-slate-800/60 backdrop-blur border border-white/35 dark:border-slate-700/60 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.iconBg }}>
                {card.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Files — 2 cols */}
          <div className="col-span-2 rounded-2xl bg-white/55 dark:bg-slate-800/60 backdrop-blur border border-white/35 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Files</h2>
              <button
                onClick={() => onNavigateTab('recent')}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                View all
              </button>
            </div>
            <div>
              {recentFiles.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No recent files yet. Upload a file to get started.
                </div>
              ) : (
                recentFiles.map((file, i) => (
                  <div
                    key={file.id}
                    onClick={() => onOpenEditor(file)}
                    className="flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors file-item-enter hover:bg-white/40 dark:hover:bg-slate-700/50 border-b border-slate-100/60 dark:border-slate-700/40 last:border-0"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}
                      >
                        {getFileIcon(file)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {file.name}
                        </div>
                        <div className="text-xs mt-0.5 text-slate-400 dark:text-slate-500">
                          {file.modified} · {file.size}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {favoriteIds.has(file.id) && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      )}
                      {file.sharing !== 'Private' && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}
                          title={file.sharing}
                        >
                          <Users className="w-3 h-3 text-teal-500" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Storage Panel */}
          <div className="rounded-2xl overflow-hidden bg-white/60 dark:bg-slate-800/70 backdrop-blur border border-white/40 dark:border-slate-700/60 shadow-sm"
            style={{ boxShadow: '0 1px 0 0 rgba(255,255,255,0.7) inset, 0 10px 36px rgba(99,102,241,0.10)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Storage</h2>
              <button
                onClick={() => onNavigateTab('settings-tab')}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                Manage
              </button>
            </div>
            <div className="p-5 flex flex-col items-center">
              {/* Donut */}
              <div className="relative w-32 h-32 mb-4">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="storageDonutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={storageDonutColor} stopOpacity="0.75" />
                      <stop offset="100%" stopColor={storageDonutColor} stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  {/* Track */}
                  <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="14" />
                  {/* Progress — uses donutFill so tiny usage shows a visible sliver */}
                  <circle
                    cx="60" cy="60" r="48" fill="none"
                    stroke="url(#storageDonutGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${circumference * (1 - donutFill)}`}
                    style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${storageBarGlow})` }}
                  />
                </svg>
                {/* Center label — shows accurate decimal percent */}
                <div className="absolute inset-[18px] rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60">
                  <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight text-center px-1">
                    {storagePercentLabel}
                  </span>
                </div>
              </div>

              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {storageUsedLabel} used
              </p>
              <p className="text-xs mt-1 text-center text-slate-500 dark:text-slate-400">
                of {storageLimitGB}.0 GB available
              </p>

              {/* Progress bar */}
              <div className="w-full mt-4 h-2 rounded-full overflow-hidden bg-slate-200/80 dark:bg-slate-700/80">
                <div
                  className="h-full storage-bar-fill"
                  style={{
                    width: storageUsedBytes > 0 ? `max(${storageRatio * 100}%, 2px)` : '0%',
                    background: `linear-gradient(90deg, ${storageBarColor}cc, ${storageBarColor})`,
                    boxShadow: `0 0 8px ${storageBarGlow}`,
                    borderRadius: '999px'
                  }}
                />
              </div>

              <p className="text-xs mt-2 text-slate-400 dark:text-slate-500">
                {storagePercentRaw < 70 ? 'Storage is healthy' : storagePercentRaw < 90 ? 'Storage filling up' : 'Storage almost full!'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          {/* Quick Access */}
          <div className="rounded-2xl bg-white/55 dark:bg-slate-800/60 backdrop-blur border border-white/35 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Quick Access</h2>
            </div>
            <div className="p-4 space-y-1">
              {[
                { label: 'My Files',       tab: 'files',       icon: '📁' },
                { label: 'Shared',         tab: 'shared',      icon: '🔗' },
                { label: 'Team Spaces',    tab: 'team-spaces', icon: '👥' },
                { label: 'Personal Vault', tab: 'vault',       icon: '🔐' },
                { label: 'Projects',       tab: 'projects',    icon: '🗂️' },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => onNavigateTab(item.tab)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all text-left text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/60 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Favourites */}
          <div className="rounded-2xl bg-white/55 dark:bg-slate-800/60 backdrop-blur border border-white/35 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Favourites</h2>
              <button
                onClick={() => onNavigateTab('favorites')}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                View all
              </button>
            </div>
            <div className="p-4 space-y-1">
              {favoriteFiles.length === 0 ? (
                <p className="text-sm px-3 py-2 text-slate-400 dark:text-slate-500">
                  No favourites yet — star a file to add it here.
                </p>
              ) : (
                favoriteFiles.slice(0, 4).map(file => (
                  <div
                    key={file.id}
                    onClick={() => onOpenEditor(file)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/50 dark:hover:bg-slate-700/60"
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="text-sm truncate text-slate-700 dark:text-slate-300">
                      {file.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shared With Me */}
          <div className="rounded-2xl bg-white/55 dark:bg-slate-800/60 backdrop-blur border border-white/35 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Shared</h2>
              <button
                onClick={() => onNavigateTab('shared')}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                View all
              </button>
            </div>
            <div className="p-4 space-y-1">
              {sharedFiles.length === 0 ? (
                <p className="text-sm px-3 py-2 text-slate-400 dark:text-slate-500">
                  No shared files yet.
                </p>
              ) : (
                sharedFiles.slice(0, 4).map(file => (
                  <div
                    key={file.id}
                    onClick={() => onOpenEditor(file)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/50 dark:hover:bg-slate-700/60"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}
                    >
                      <Users className="w-3 h-3 text-teal-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm truncate text-slate-700 dark:text-slate-300">{file.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{file.sharing}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
