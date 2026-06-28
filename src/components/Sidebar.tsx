/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Folder,
  Users,
  Star,
  Clock,
  Trash2,
  Building2,
  FolderKanban,
  Settings,
  ShieldCheck,
  PanelLeftClose
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const MRISHAN_LOGO = '/image.png';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  collapsed,
  onToggleCollapsed
}: SidebarProps) {
  const navItems: { tab: string; label: string; icon: React.ReactNode }[] = [
    { tab: 'home',         label: 'Dashboard',   icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { tab: 'files',        label: 'My Files',     icon: <Folder          className="w-[18px] h-[18px]" /> },
    { tab: 'shared',       label: 'Shared',       icon: <Users           className="w-[18px] h-[18px]" /> },
    { tab: 'favorites',    label: 'Favorites',    icon: <Star            className="w-[18px] h-[18px]" /> },
    { tab: 'recent',       label: 'Recent',       icon: <Clock           className="w-[18px] h-[18px]" /> },
    { tab: 'recycle-bin',  label: 'Trash',        icon: <Trash2          className="w-[18px] h-[18px]" /> },
    { tab: 'team-spaces',  label: 'Team Spaces',  icon: <Building2       className="w-[18px] h-[18px]" /> },
    { tab: 'projects',     label: 'Projects',     icon: <FolderKanban    className="w-[18px] h-[18px]" /> },
    { tab: 'vault',        label: 'Vault',        icon: <ShieldCheck     className="w-[18px] h-[18px]" /> },
    { tab: 'settings-tab', label: 'Settings',     icon: <Settings        className="w-[18px] h-[18px]" /> },
  ];

  const sidebarStyle: React.CSSProperties = {
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    borderRight: '1px solid var(--glass-border)',
  };

  const activeStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
    borderLeft: '3px solid var(--accent-primary)',
    color: 'var(--accent-primary)',
    fontWeight: 600
  };

  const inactiveStyle: React.CSSProperties = {
    color: '#64748B',
    borderLeft: '3px solid transparent',
  };

  if (collapsed) {
    return (
      <aside
        className="w-16 flex flex-col items-center py-4 gap-1 h-[calc(100vh-4rem)]"
        style={sidebarStyle}
      >
        <button
          onClick={onToggleCollapsed}
          className="p-2.5 mb-3 rounded-lg transition-colors"
          title="Expand sidebar"
          style={{ color: '#64748B' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <PanelLeftClose className="w-[18px] h-[18px] rotate-180" />
        </button>
        {navItems.map(item => (
          <button
            key={item.tab}
            onClick={() => setCurrentTab(item.tab)}
            title={item.label}
            className="p-2.5 rounded-lg transition-all w-10 flex items-center justify-center"
            style={currentTab === item.tab ? { ...activeStyle, borderLeft: 'none', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))' } : inactiveStyle}
            onMouseEnter={e => { if (currentTab !== item.tab) e.currentTarget.style.color = 'var(--accent-primary)'; }}
            onMouseLeave={e => { if (currentTab !== item.tab) e.currentTarget.style.color = '#64748B'; }}
          >
            {item.icon}
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside
      className="w-64 flex flex-col h-[calc(100vh-4rem)] select-none"
      style={sidebarStyle}
    >
      {/* Sidebar header with logo */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(99,102,241,0.18)' }}
          >
            <img src={MRISHAN_LOGO} alt="MriShan Drive" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-bold text-sm" style={{ color: '#0F172A' }}>MriShan Drive</span>
        </div>
        <button
          onClick={onToggleCollapsed}
          className="p-2 rounded-lg transition-colors"
          title="Collapse sidebar"
          style={{ color: '#64748B' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <PanelLeftClose className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Section label */}
      <div className="px-4 pt-3 pb-1">
        <span
          className="text-[10px] font-semibold tracking-[0.08em] uppercase"
          style={{ color: '#64748B' }}
        >
          Navigation
        </span>
      </div>

      <nav className="flex-1 px-3 pt-1 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.tab}
            onClick={() => setCurrentTab(item.tab)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all"
            style={currentTab === item.tab ? activeStyle : inactiveStyle}
            onMouseEnter={e => {
              if (currentTab !== item.tab) {
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
              }
            }}
            onMouseLeave={e => {
              if (currentTab !== item.tab) {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
