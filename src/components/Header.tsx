/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Upload, FolderPlus, Bell, ChevronDown, AlertTriangle, CheckCircle, Info, Settings, LogOut, User as UserIcon, Sun, Moon, Folder, FileText, Image as ImageIcon } from 'lucide-react';
import { AlertNotification, UserAccount, Theme, FileItem } from '../types';

const MRISHAN_LOGO = '/image.png';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserAccount;
  files: FileItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  alerts: AlertNotification[];
  onMarkAlertAsRead: (alertId: string) => void;
  onClearAllAlerts: () => void;
  onTriggerAISearch: () => void;
  onSearchNavigate: (file: FileItem) => void;
  aiSearching: boolean;
  storagePercent: number;
  onQuickUpload: () => void;
  onCreateFolder: () => void;
  onSignOut: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

/**
 * Format a storage percentage for display.
 * - 0 bytes used          → "0%"
 * - >0 but rounds to 0%  → "<1%"
 * - 1–99%                → "X%" (1 decimal only when < 1, otherwise integer)
 * - 100%                 → "100%"
 */
function formatStoragePercent(usedBytes: number, limitBytes: number): string {
  if (usedBytes <= 0) return '0%';
  const ratio = usedBytes / limitBytes;
  const pct = ratio * 100;
  if (pct < 1) {
    // Show one significant decimal, e.g. "0.02%" instead of "<1%"
    return `${parseFloat(pct.toFixed(2))}%`;
  }
  return `${Math.round(pct)}%`;
}

export default function Header({
  currentTab,
  setCurrentTab,
  user,
  files,
  searchQuery,
  setSearchQuery,
  alerts,
  onMarkAlertAsRead,
  onClearAllAlerts,
  onTriggerAISearch,
  onSearchNavigate,
  aiSearching,
  storagePercent,
  onQuickUpload,
  onCreateFolder,
  onSignOut,
  theme,
  onToggleTheme
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Accurate storage label from raw bytes (not the pre-rounded integer from App.tsx)
  const storageLabel = formatStoragePercent(user.storageUsed, user.storageLimit);

  const searchMatches = searchQuery.trim()
    ? files
        .filter(f => !f.isDeleted && f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        .slice(0, 8)
    : [];

  const getResultIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="w-4 h-4 text-amber-500 fill-amber-500/10" />;
    if (file.type === 'image') return <ImageIcon className="w-4 h-4 text-sky-500" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const handleResultClick = (file: FileItem) => {
    onSearchNavigate(file);
    setShowSearchDropdown(false);
  };

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const initials = user.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Dynamic storage bar color based on rounded percent for thresholds
  const storageBarColor =
    storagePercent >= 90 ? '#EF4444' :
    storagePercent >= 70 ? '#F59E0B' :
    'var(--accent-primary)';

  const storageBarGlow =
    storagePercent >= 90 ? 'rgba(239,68,68,0.4)' :
    storagePercent >= 70 ? 'rgba(245,158,11,0.4)' :
    'rgba(59,130,246,0.4)';

  // Actual fill ratio for the mini bar (not rounded)
  const storageRatio = Math.min(1, user.storageUsed / user.storageLimit);
  const storageBarWidth = user.storageUsed > 0
    ? `max(${storageRatio * 100}%, 3px)`
    : '0%';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const glassPanel: React.CSSProperties = {
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)'
  };

  return (
    <header
      className="h-16 px-5 flex items-center justify-between select-none relative z-50 gap-4"
      style={{
        ...glassPanel,
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '1px solid var(--glass-border)'
      }}
    >
      {/* Left: Branding */}
      <div
        className="flex items-center gap-2.5 cursor-pointer shrink-0"
        onClick={() => setCurrentTab('home')}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 2px 12px rgba(99,102,241,0.18)'
          }}
        >
          <img src={MRISHAN_LOGO} alt="MriShan Drive" className="w-7 h-7 object-contain" />
        </div>
        <div className="leading-tight">
          <div className="font-bold text-[15px]" style={{ color: '#0F172A' }}>MriShan Drive</div>
          <div className="text-[10px] font-medium -mt-0.5" style={{ color: '#64748B' }}>CLOUD WORKSPACE</div>
        </div>
      </div>

      {/* Middle: Search Box */}
      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
            onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (searchMatches.length > 0) {
                  handleResultClick(searchMatches[0]);
                } else {
                  onTriggerAISearch();
                }
              } else if (e.key === 'Escape') {
                setShowSearchDropdown(false);
              }
            }}
            placeholder="Search files, folders, owners, or content"
            className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)'
            }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'; }}
          />
        </div>

        {/* Live search results dropdown */}
        {showSearchDropdown && searchQuery.trim() && (
          <div
            className="absolute left-0 right-0 mt-2 z-50 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0 8px 40px rgba(99,102,241,0.16)'
            }}
          >
            {searchMatches.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matches in your files. Try{' '}
                <button
                  onClick={() => { onTriggerAISearch(); setShowSearchDropdown(false); }}
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  AI semantic search
                </button>{' '}
                instead.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto py-1.5">
                {searchMatches.map(file => (
                  <button
                    key={file.id}
                    onClick={() => handleResultClick(file)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {getResultIcon(file)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{file.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {file.path === '/' ? 'My files' : file.path}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div
              className="px-3.5 py-2 border-t flex items-center justify-between"
              style={{ borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(248,250,252,0.6)' }}
            >
              <span className="text-[10px] text-slate-400">Press Enter to jump to top result</span>
              <button
                onClick={() => { onTriggerAISearch(); setShowSearchDropdown(false); }}
                disabled={aiSearching}
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--accent-primary)' }}
              >
                <Sparkles className={`w-3 h-3 ${aiSearching ? 'animate-pulse' : ''}`} />
                AI search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* AI Search */}
        <button
          onClick={onTriggerAISearch}
          disabled={aiSearching}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: '#334155',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
        >
          <Sparkles className={`w-4 h-4 text-blue-500 ${aiSearching ? 'animate-pulse' : ''}`} />
          Search
        </button>

        {/* Upload */}
        <button
          onClick={onQuickUpload}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition-all"
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

        {/* Create Folder */}
        <button
          onClick={onCreateFolder}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: '#334155',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
        >
          <FolderPlus className="w-4 h-4" />
          Folder
        </button>

        {/* Storage pill — uses accurate label computed from raw bytes */}
        <button
          onClick={() => setCurrentTab('settings-tab')}
          className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs transition-all"
          style={{
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid var(--glass-border)',
            borderRadius: '999px',
            backdropFilter: 'blur(8px)',
            color: '#334155'
          }}
          title={`${storageLabel} of storage used`}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
        >
          <span className="text-slate-500 font-medium">Storage</span>
          <span className="font-bold" style={{ color: storageBarColor }}>{storageLabel}</span>
          <span
            className="w-16 h-1.5"
            style={{ background: 'rgba(99,102,241,0.12)', borderRadius: '999px', overflow: 'hidden', display: 'inline-block' }}
          >
            <span
              className="block h-full storage-bar-fill"
              style={{
                width: storageBarWidth,
                background: storageBarColor,
                boxShadow: `0 0 6px ${storageBarGlow}`
              }}
            />
          </span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(v => !v); setShowAccountMenu(false); }}
            className="p-2.5 rounded-full transition-colors relative"
            style={{ color: '#64748B' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 z-50 text-xs overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: '0 8px 40px rgba(99,102,241,0.12)'
              }}
            >
              <div className="p-3 border-b border-white/40 flex items-center justify-between">
                <span className="font-semibold text-slate-800">Notifications</span>
                {alerts.length > 0 && (
                  <button onClick={onClearAllAlerts} className="text-slate-400 hover:text-red-500 transition-colors">
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    <span>You're all caught up!</span>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => onMarkAlertAsRead(alert.id)}
                      className="p-3 border-b border-white/30 cursor-pointer transition-colors flex gap-2.5"
                      style={{ background: !alert.isRead ? 'rgba(59,130,246,0.05)' : 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = !alert.isRead ? 'rgba(59,130,246,0.05)' : 'transparent'; }}
                    >
                      <div className="mt-0.5">
                        {alert.severity === 'Critical' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : alert.severity === 'Warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-slate-800">{alert.serverName}</span>
                          <span className="text-[10px] text-slate-400">{alert.timestamp.split(' ').slice(1).join(' ')}</span>
                        </div>
                        <p className="text-slate-500 leading-normal">{alert.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {alerts.length > 0 && (
                <div className="p-2.5 border-t border-white/40 text-center" style={{ background: 'rgba(248,250,252,0.6)' }}>
                  <button
                    onClick={() => { setCurrentTab('servers'); setShowNotifications(false); }}
                    className="font-medium transition-colors hover:underline"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    View all alerts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account avatar */}
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => { setShowAccountMenu(v => !v); setShowNotifications(false); }}
            className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
                title={`${user.name} (${user.role})`}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                title={`${user.name} (${user.role})`}
                style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
              >
                {initials}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showAccountMenu && (
            <div
              className="absolute right-0 mt-2 w-56 z-50 text-xs py-1.5"
              style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: '0 8px 40px rgba(99,102,241,0.12)'
              }}
            >
              <div className="px-3 py-2 border-b border-white/40">
                <div className="font-semibold text-slate-800 truncate">{user.name}</div>
                <div className="text-slate-400 truncate">{user.email}</div>
              </div>

              {/* Theme toggle */}
              <button
                onClick={onToggleTheme}
                className="w-full text-left px-3 py-2 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-between gap-2"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </span>
                <span
                  className="relative w-8 h-[18px] rounded-full transition-colors"
                  style={{ background: theme === 'dark' ? 'var(--accent-primary)' : '#cbd5e1' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-white transition-transform"
                    style={{ transform: theme === 'dark' ? 'translateX(14px)' : 'translateX(0)' }}
                  />
                </span>
              </button>

              <div className="h-px bg-slate-200/60 my-1" />

              <button
                onClick={() => { setCurrentTab('settings-tab'); setShowAccountMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <UserIcon className="w-3.5 h-3.5" />
                Settings
              </button>
              <button
                onClick={() => { setCurrentTab('developer'); setShowAccountMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Settings className="w-3.5 h-3.5" />
                Developer settings
              </button>
              <div className="h-px bg-slate-200/60 my-1" />
              <button
                onClick={() => { setShowAccountMenu(false); onSignOut(); }}
                className="w-full text-left px-3 py-2 text-slate-600 hover:text-red-600 transition-all flex items-center gap-2"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
