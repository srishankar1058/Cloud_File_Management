/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App.tsx — root shell for MriShan Drive.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FileItem, AuditLog, AlertNotification, ServerInstance, PhotoAlbum,
  UserAccount, DeviceItem, CommentItem
} from './types';
import { subscribeToAuth, signOutCurrentUser } from './services/firebase';
import type { User } from './services/firebase';
import { loadWorkspace, saveWorkspaceItem, deleteWorkspaceItem, saveUserProfile } from './services/database';
import { fetchFavoriteIds, toggleFavoriteRemote } from './services/vault';
import { initialAlbums, initialServers, initialAlerts, currentUser, initialWebhooks } from './mockData';
import { useTheme } from './contexts/ThemeContext';

import AuthScreen from './AuthScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileDrive from './components/FileDrive';
import DetailsPanel from './components/DetailsPanel';
import HomeDashboard from './components/HomeDashboard';
import DocumentEditor from './components/DocumentEditor';
import PersonalVault from './components/PersonalVault';
import ServerMonitor from './components/ServerMonitor';
import PhotoGallery from './components/PhotoGallery';
import DeveloperConsole from './components/DeveloperConsole';
import SettingsPage from './components/SettingsPage';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
let toastCounter = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, showToast };
}

// ─── Upload category modal ────────────────────────────────────────────────────

interface UploadCategoryChoice {
  sharing: FileItem['sharing'];
  addToFavorites: boolean;
}

function UploadCategoryModal({
  fileName,
  currentTab,
  onConfirm,
  onCancel
}: {
  fileName: string;
  currentTab: string;
  onConfirm: (choice: UploadCategoryChoice) => void;
  onCancel: () => void;
}) {
  const defaultSharing = (): FileItem['sharing'] => {
    if (currentTab === 'shared') return 'Shared';
    if (currentTab === 'team-spaces') return 'Team';
    return 'Private';
  };

  const [sharing, setSharing] = useState<FileItem['sharing']>(defaultSharing());
  const [addToFavorites, setAddToFavorites] = useState(currentTab === 'favorites');

  const options: { value: FileItem['sharing']; label: string; desc: string }[] = [
    { value: 'Private',  label: '🔒 Private',    desc: 'Only you can access' },
    { value: 'Public',   label: '🌐 Public',     desc: 'Anyone with the link' },
    { value: 'Shared',   label: '🔗 Shared',     desc: 'Share with specific people' },
    { value: 'Team',     label: '👥 Team Space', desc: 'Visible to your team' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Where should this file go?</h3>
          <p className="text-xs mt-1 truncate text-slate-500 dark:text-slate-400">
            📄 <span className="font-medium text-slate-700 dark:text-slate-300">{fileName}</span>
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Visibility</p>
          <div className="grid grid-cols-2 gap-2">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSharing(opt.value)}
                className="p-3.5 text-left transition-all rounded-xl"
                style={{
                  border: sharing === opt.value ? '2px solid #3B82F6' : '1px solid rgba(148,163,184,0.3)',
                  background: sharing === opt.value ? 'rgba(59,130,246,0.10)' : 'transparent',
                }}
              >
                <div className={`text-sm font-bold mb-0.5 ${sharing === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {opt.label}
                </div>
                <div className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{opt.desc}</div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <label
              className="flex items-center gap-3 cursor-pointer select-none group"
              onClick={() => setAddToFavorites(v => !v)}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                addToFavorites ? 'bg-amber-400 border-amber-400' : 'border-slate-300 dark:border-slate-600 group-hover:border-amber-300'
              }`}>
                {addToFavorites && (
                  <svg viewBox="0 0 10 8" fill="none" className="w-3 h-3">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Add to Favourites ⭐</span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Pinned to your Favourites tab for quick access</p>
              </div>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ sharing, addToFavorites })}
            className="px-5 py-2 text-white text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
              borderRadius: '10px',
              border: 'none',
              boxShadow: '0 2px 12px rgba(99,102,241,0.3)'
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
          >
            Upload File
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

/**
 * Parse a human-readable size string (e.g. "358.6 KB", "1.2 MB", "500 B")
 * back to bytes. Used as a fallback when f.bytes is 0 / undefined after reload.
 */
function parseSizeToBytes(size: string | undefined): number {
  if (!size) return 0;
  const match = size.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit  = (match[2] || 'B').toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4
  };
  return Math.round(value * (multipliers[unit] ?? 1));
}

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [authUser, setAuthUser]   = useState<User | null | undefined>(undefined);
  const [authLoading, setAuthLoading] = useState(true);

  const [files, setFiles]         = useState<FileItem[]>([]);
  const [servers]                 = useState<ServerInstance[]>(initialServers);
  const [alerts, setAlerts]       = useState<AlertNotification[]>(initialAlerts);
  const [albums]                  = useState<PhotoAlbum[]>(initialAlbums);
  const [user, setUser]           = useState<UserAccount>(currentUser);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [webhooks]                = useState(initialWebhooks);

  const [currentTab, setCurrentTabRaw] = useState<string>(() => {
    try { return localStorage.getItem('mrishan:currentTab') || 'home'; } catch { return 'home'; }
  });
  const setCurrentTab = useCallback((tab: string) => {
    setCurrentTabRaw(tab);
    try { localStorage.setItem('mrishan:currentTab', tab); } catch {}
  }, []);

  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [editingFile, setEditingFile]   = useState<FileItem | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery]         = useState('');
  const [aiSearchResults, setAiSearchResults] = useState<any[] | null>(null);
  const [aiSearchSummary, setAiSearchSummary] = useState<string | null>(null);
  const [aiSearching, setAiSearching]         = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFolderModal, setShowFolderModal]   = useState(false);
  const [newFolderName, setNewFolderName]       = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [uploadSourceTab, setUploadSourceTab]     = useState<string>('files');

  // Track which project folder is "active" for uploads from the Projects tab
  const [activeProjectPath, setActiveProjectPath] = useState<string>('/');

  const { toasts, showToast } = useToasts();

  // ─── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = subscribeToAuth(async (fbUser) => {
      setAuthUser(fbUser);
      setAuthLoading(false);

      if (fbUser) {
        const freshProfile: UserAccount = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'New User',
          email: fbUser.email || '',
          role: 'User',
          status: 'Active',
          storageUsed: 0,
          storageLimit: 5 * 1024 * 1024 * 1024,
          mfaEnabled: false,
          activeDevices: []
        };
        setUser(freshProfile);

        try {
          const { profile, files: loadedFiles, auditLogs: loadedLogs, devices } =
            await loadWorkspace(fbUser.uid);

          setFiles(loadedFiles ?? []);
          if (loadedLogs && loadedLogs.length > 0) setAuditLogs(loadedLogs);
          if (profile) {
            setUser(prev => ({ ...prev, ...profile, activeDevices: devices ?? prev.activeDevices }));
          } else {
            saveUserProfile(freshProfile).catch(() => {});
          }
        } catch {}

        try {
          const ids = await fetchFavoriteIds();
          setFavoriteIds(ids);
        } catch {}
      } else {
        setUser(currentUser);
        setFiles([]);
        setAuditLogs([]);
        setFavoriteIds(new Set());
        setSelectedFile(null);
        setEditingFile(null);
        setCurrentTab('home');
        setCurrentPath('/');
      }
    });
    return unsub;
  }, []);

  // ─── Sign out ─────────────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    try {
      await signOutCurrentUser();
      showToast('Signed out');
    } catch {
      showToast('Sign out failed — please try again', 'error');
    }
  }, [showToast]);

  // ─── Audit log ────────────────────────────────────────────────────────────────

  const addAudit = useCallback((action: string, details: string, status: AuditLog['status'] = 'Success') => {
    const entry: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }),
      user: authUser?.email ?? user.email,
      action,
      details,
      status,
      ipAddress: '198.51.100.42'
    };
    setAuditLogs(prev => [entry, ...prev]);
    if (authUser) {
      saveWorkspaceItem('audit_logs', authUser.uid, entry).catch(() => {});
    }
  }, [authUser, user.email]);

  // ─── Persist file ─────────────────────────────────────────────────────────────

  const persistFile = useCallback((file: FileItem) => {
    if (authUser) {
      saveWorkspaceItem('files', authUser.uid, file).catch(() => {});
    }
  }, [authUser]);

  // ─── Folder creation ──────────────────────────────────────────────────────────

  const handleCreateFolder = useCallback((name: string) => {
    const newFolder: FileItem = {
      id: `folder-${Date.now()}`,
      name,
      type: 'folder',
      modified: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      size: '0 items',
      bytes: 0,
      sharing: 'Private',
      path: currentPath,
      owner: user.name
    };
    setFiles(prev => [...prev, newFolder]);
    persistFile(newFolder);
    addAudit('FOLDER_CREATED', `Created folder "${name}" at ${currentPath}`);
    showToast(`Folder "${name}" created`);
  }, [currentPath, user.name, persistFile, addAudit, showToast]);

  const handleCreateFolderSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      handleCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderModal(false);
    }
  }, [newFolderName, handleCreateFolder]);

  const handleCreateFile = useCallback((
    name: string,
    content: string,
    type: 'folder' | 'document' | 'image' | 'config' | 'log'
  ) => {
    const ext   = name.split('.').pop() || '';
    const bytes = new TextEncoder().encode(content).length;
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name, type,
      extension: ext,
      modified: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      size: bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`,
      bytes,
      sharing: 'Private',
      path: currentPath,
      content,
      owner: user.name
    };
    setFiles(prev => [...prev, newFile]);
    persistFile(newFile);
    addAudit('FILE_CREATED', `Created file "${name}" at ${currentPath}`);
  }, [currentPath, user.name, persistFile, addAudit]);

  // ─── Upload flow ──────────────────────────────────────────────────────────────

  const handleUploadFilePicked = useCallback((file: File) => {
    setUploadSourceTab(currentTab);
    setPendingUploadFile(file);
  }, [currentTab]);

  const handleUploadConfirm = useCallback((choice: UploadCategoryChoice) => {
    if (!pendingUploadFile) return;
    const file = pendingUploadFile;
    setPendingUploadFile(null);

    const reader = new FileReader();
    const isImage  = file.type.startsWith('image/');
    const isPdf    = file.type === 'application/pdf';
    const isBinary = isImage || isPdf || !file.type.startsWith('text/');

    const virtualTabs = ['favorites', 'recent', 'shared', 'team-spaces', 'recycle-bin', 'home'];

    // For projects tab: upload into the active project folder path
    let uploadPath = virtualTabs.includes(currentTab) ? '/' : currentPath;
    if (currentTab === 'projects') {
      uploadPath = activeProjectPath;
    }

    reader.onload = (e) => {
      const result = e.target?.result as string;
      const bytes  = file.size;

      const newFile: FileItem = {
        id:        `upload-${Date.now()}`,
        name:      file.name,
        type:      isImage ? 'image' : 'document',
        extension: file.name.split('.').pop() || '',
        modified:  new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        size:      bytes > 1048576
                     ? `${(bytes / 1048576).toFixed(1)} MB`
                     : bytes > 1024
                       ? `${(bytes / 1024).toFixed(1)} KB`
                       : `${bytes} B`,
        bytes,
        sharing: choice.sharing,
        path: uploadPath,
        ...(isBinary ? { dataUrl: result } : { content: result }),
        owner: user.name
      };

      setFiles(prev => [...prev, newFile]);
      persistFile(newFile);
      addAudit('FILE_UPLOADED', `Uploaded "${file.name}" (${newFile.size}) → ${uploadPath} [${choice.sharing}]`);
      showToast(`"${file.name}" uploaded`);

      if (choice.addToFavorites) {
        const fileId = newFile.id;
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.add(fileId);
          return next;
        });
        toggleFavoriteRemote(fileId).catch(() => {});
      }

      if (uploadSourceTab === 'favorites' && choice.addToFavorites) {
        // stay
      } else if (uploadSourceTab === 'shared' && (choice.sharing === 'Shared' || choice.sharing === 'Public')) {
        // stay
      } else if (uploadSourceTab === 'team-spaces' && choice.sharing === 'Team') {
        // stay
      } else if (uploadSourceTab === 'projects') {
        // stay in projects tab so user can see the uploaded file inside the folder
      } else if (virtualTabs.includes(uploadSourceTab)) {
        setCurrentTab('files');
      }
    };

    if (isBinary) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  }, [pendingUploadFile, currentPath, currentTab, uploadSourceTab, activeProjectPath, user.name, persistFile, addAudit, showToast, setCurrentTab]);

  const handleUploadCancel = useCallback(() => {
    setPendingUploadFile(null);
  }, []);

  // ─── File CRUD ────────────────────────────────────────────────────────────────

  const handleDeleteFile = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, isDeleted: true, deletedAt: new Date().toISOString() } : f
    ));
    const file = files.find(f => f.id === fileId);
    if (file) {
      persistFile({ ...file, isDeleted: true, deletedAt: new Date().toISOString() });
      addAudit('FILE_DELETED', `Sent "${file.name}" to Trash`);
    }
    if (selectedFile?.id === fileId) setSelectedFile(null);
  }, [files, selectedFile, persistFile, addAudit]);

  const handleRestoreFile = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, isDeleted: false, deletedAt: undefined } : f
    ));
    const file = files.find(f => f.id === fileId);
    if (file) {
      persistFile({ ...file, isDeleted: false, deletedAt: undefined });
      addAudit('FILE_RESTORED', `Restored "${file.name}" from Trash`);
    }
    showToast('File restored');
  }, [files, persistFile, addAudit, showToast]);

  const handlePurgePermanently = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (file) {
      if (authUser) deleteWorkspaceItem('files', authUser.uid, fileId).catch(() => {});
      addAudit('FILE_PURGED', `Permanently deleted "${file.name}"`, 'Warning');
    }
  }, [files, authUser, addAudit]);

  const handleSaveFile = useCallback((fileId: string, updatedContent: string, commitNote?: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const newVersion = {
        version:    (f.versions?.length ?? 0) + 1,
        modified:   new Date().toLocaleString(),
        modifiedBy: user.name,
        size:       f.size,
        content:    f.content || '',
        note:       commitNote
      };
      const updated: FileItem = {
        ...f,
        content:  updatedContent,
        modified: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        versions: [newVersion, ...(f.versions || [])].slice(0, 10)
      };
      persistFile(updated);
      return updated;
    }));
    if (editingFile?.id === fileId) {
      setEditingFile(prev => prev ? { ...prev, content: updatedContent } : prev);
    }
    addAudit('DOCUMENT_EDIT', `Saved "${fileId}"${commitNote ? ': ' + commitNote : ''}`);
  }, [user.name, editingFile, persistFile, addAudit]);

  const handleAddComment = useCallback((fileId: string, commentText: string) => {
    const newComment: CommentItem = {
      id:        `c-${Date.now()}`,
      user:      user.name,
      avatar:    user.name.slice(0, 2).toUpperCase(),
      text:      commentText,
      timestamp: new Date().toLocaleString()
    };
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const updated = { ...f, comments: [...(f.comments || []), newComment] };
      persistFile(updated);
      return updated;
    }));
    // Also update editingFile so comments show live without re-open
    setEditingFile(prev => {
      if (!prev || prev.id !== fileId) return prev;
      return { ...prev, comments: [...(prev.comments || []), newComment] };
    });
  }, [user.name, persistFile]);

  const handleUpdateSharing = useCallback((fileId: string, sharing: FileItem['sharing']) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const updated = { ...f, sharing };
      persistFile(updated);
      return updated;
    }));
    // Also update selectedFile live
    setSelectedFile(prev => prev && prev.id === fileId ? { ...prev, sharing } : prev);
    addAudit('SHARING_UPDATED', `Sharing for "${fileId}" → ${sharing}`);
  }, [persistFile, addAudit]);

  const handleRestoreVersion = useCallback((fileId: string, versionIndex: number) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId || !f.versions?.[versionIndex]) return f;
      const updated = { ...f, content: f.versions[versionIndex].content };
      persistFile(updated);
      return updated;
    }));
    addAudit('VERSION_RESTORED', `Restored version ${versionIndex + 1} of "${fileId}"`);
    showToast('Version restored');
  }, [persistFile, addAudit, showToast]);

  const handleToggleSelectiveSync = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, isSelectiveSync: !f.isSelectiveSync } : f
    ));
  }, []);

  // ─── Favourites ───────────────────────────────────────────────────────────────

  const handleToggleFavorite = useCallback(async (fileId: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId); else next.add(fileId);
      return next;
    });
    try { await toggleFavoriteRemote(fileId); } catch {}
  }, []);

  // ─── Alerts ───────────────────────────────────────────────────────────────────

  const handleMarkAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  }, []);

  const handleClearAllAlerts = useCallback(() => setAlerts([]), []);

  // ─── Search navigation ────────────────────────────────────────────────────────
  const handleSearchNavigate = useCallback((file: FileItem) => {
    setCurrentTab('files');
    if (file.type === 'folder') {
      const folderPath = file.path === '/' ? `/${file.name}` : `${file.path}/${file.name}`;
      setCurrentPath(folderPath);
      setSelectedFile(null);
    } else {
      setCurrentPath(file.path);
      setSelectedFile(file);
    }
    setSearchQuery('');
    setAiSearchResults(null);
    setAiSearchSummary(null);
  }, [setCurrentTab]);

  // ─── AI Search ────────────────────────────────────────────────────────────────

  const handleTriggerAISearch = useCallback(async () => {
    if (!searchQuery.trim()) { setAiSearchResults(null); setAiSearchSummary(null); return; }
    setAiSearching(true);
    setAiSearchResults(null);
    setAiSearchSummary(null);
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, files: files.filter(f => !f.isDeleted) })
      });
      const data = await res.json();
      setAiSearchResults(data.results ?? []);
      setAiSearchSummary(data.summary ?? null);
    } catch {
      const q = searchQuery.toLowerCase();
      const matched = files
        .filter(f => !f.isDeleted && f.name.toLowerCase().includes(q))
        .map(f => ({ id: f.id, relevance: 'Name match', snippet: f.name }));
      setAiSearchResults(matched);
      setAiSearchSummary(`${matched.length} local matches for "${searchQuery}"`);
    } finally {
      setAiSearching(false);
    }
  }, [searchQuery, files]);

  useEffect(() => {
    if (!searchQuery) { setAiSearchResults(null); setAiSearchSummary(null); }
  }, [searchQuery]);

  // ─── Download ─────────────────────────────────────────────────────────────────

  const handleDownloadFile = useCallback((file: FileItem) => {
    const a = document.createElement('a');
    if (file.dataUrl) {
      a.href = file.dataUrl;
    } else {
      const blob = new Blob([file.content ?? ''], { type: 'text/plain' });
      a.href = URL.createObjectURL(blob);
    }
    a.download = file.name;
    a.click();
    if (!file.dataUrl) URL.revokeObjectURL(a.href);
    addAudit('FILE_DOWNLOADED', `Downloaded "${file.name}"`);
  }, [addAudit]);

  // ─── Settings handlers ────────────────────────────────────────────────────────

  const handleToggleMFA = useCallback(() => {
    setUser(prev => {
      const updated = { ...prev, mfaEnabled: !prev.mfaEnabled };
      if (authUser) saveUserProfile(updated).catch(() => {});
      return updated;
    });
    addAudit('MFA_TOGGLED', `MFA ${user.mfaEnabled ? 'disabled' : 'enabled'}`);
    showToast(`MFA ${user.mfaEnabled ? 'disabled' : 'enabled'}`);
  }, [authUser, user.mfaEnabled, addAudit, showToast]);

  const handleRemoveDevice = useCallback((deviceId: string) => {
    setUser(prev => {
      const updated = { ...prev, activeDevices: prev.activeDevices.filter(d => d.id !== deviceId) };
      if (authUser) saveUserProfile(updated).catch(() => {});
      return updated;
    });
    addAudit('DEVICE_DEAUTHORIZED', `Removed device ${deviceId}`, 'Warning');
    showToast('Device removed', 'info');
  }, [authUser, addAudit, showToast]);

  const handleUpdateName = useCallback((name: string) => {
    setUser(prev => {
      const updated = { ...prev, name };
      if (authUser) saveUserProfile(updated).catch(() => {});
      return updated;
    });
    addAudit('PROFILE_UPDATED', `Display name → "${name}"`);
    showToast('Name updated');
  }, [authUser, addAudit, showToast]);

  const handleUpdateAvatar = useCallback((dataUrl: string) => {
    setUser(prev => {
      const updated = { ...prev, avatarUrl: dataUrl };
      if (authUser) saveUserProfile(updated).catch(() => {});
      return updated;
    });
    addAudit('AVATAR_UPDATED', 'Profile picture changed');
    showToast('Profile picture updated');
  }, [authUser, addAudit, showToast]);

  // ─── Vault adapter ────────────────────────────────────────────────────────────

  const showToastAdapter = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', title: string, msg?: string) =>
      showToast(msg ? `${title}: ${msg}` : title, type),
    [showToast]
  );

  // Dark-mode-aware display tokens passed to PersonalVault
  const vaultDisplayTokens = {
    border: 'border-slate-200 dark:border-slate-700',
    bg: 'bg-white dark:bg-slate-800',
    bgMuted: 'bg-slate-50 dark:bg-slate-900',
    text: 'text-slate-800 dark:text-slate-100',
    textSub: 'text-slate-600 dark:text-slate-300',
    textMuted: 'text-slate-400 dark:text-slate-500',
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-700',
  };

  // ─── Dynamic storage usage ───────────────────────────────────────────────────
  // Sum bytes for non-deleted, non-folder items.
  // Falls back to parsing the human-readable `size` string if `bytes` is 0/undefined
  // (can happen when binary files are stripped from localStorage on quota exceeded,
  // or if an older save didn't record bytes).
  const liveStorageUsed = useMemo(
    () => files.reduce((sum, f) => {
      if (f.isDeleted || f.type === 'folder') return sum;
      const b = f.bytes && f.bytes > 0 ? f.bytes : parseSizeToBytes(f.size);
      return sum + b;
    }, 0),
    [files]
  );

  const liveUser: UserAccount = useMemo(
    () => ({ ...user, storageUsed: liveStorageUsed }),
    [user, liveStorageUsed]
  );

  const liveStoragePercent = Math.min(100, Math.round((liveStorageUsed / user.storageLimit) * 100));

  // ─── Auth guards ──────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-root-bg">
        <div className="text-slate-400 text-sm animate-pulse">Loading MriShan Drive...</div>
      </div>
    );
  }
  if (!authUser) return <AuthScreen />;

  if (editingFile) {
    const liveFile = files.find(f => f.id === editingFile.id) ?? editingFile;
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <DocumentEditor
          file={liveFile}
          onSave={handleSaveFile}
          onClose={() => setEditingFile(null)}
          onAddComment={handleAddComment}
        />
      </div>
    );
  }

  // ─── Tab render ───────────────────────────────────────────────────────────────

  const renderMainContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeDashboard
            user={liveUser}
            files={files}
            servers={servers}
            alerts={alerts}
            auditLogs={auditLogs}
            devices={user.activeDevices}
            favoriteIds={favoriteIds}
            onNavigateTab={setCurrentTab}
            onOpenEditor={setEditingFile}
            onCreateFolder={handleCreateFolder}
            onUpload={() => fileInputRef.current?.click()}
          />
        );

      case 'vault':
        return (
          <PersonalVault
            userId={authUser?.uid ?? user.id}
            dm={vaultDisplayTokens}
            showToast={showToastAdapter}
          />
        );

      case 'servers':
        return (
          <ServerMonitor
            servers={servers}
            alerts={alerts}
            onMarkAlertAsRead={handleMarkAlertAsRead}
          />
        );

      case 'photos':
        return (
          <PhotoGallery
            files={files.filter(f => f.type === 'image' && !f.isDeleted)}
            albums={albums}
          />
        );

      case 'developer':
        return (
          <DeveloperConsole
            webhooks={webhooks}
            auditLogs={auditLogs}
          />
        );

      case 'settings-tab':
        return (
          <SettingsPage
            user={liveUser}
            auditLogs={auditLogs}
            devices={user.activeDevices}
            theme={theme}
            onToggleTheme={toggleTheme}
            onToggleMFA={handleToggleMFA}
            onRemoveDevice={handleRemoveDevice}
            onUpdateName={handleUpdateName}
            onUpdateAvatar={handleUpdateAvatar}
          />
        );

      case 'team-spaces':
      case 'projects':
      case 'files':
      case 'shared':
      case 'favorites':
      case 'recent':
      case 'recycle-bin':
        return (
          <div className="flex flex-1 overflow-hidden">
            <FileDrive
              files={files}
              currentPath={currentPath}
              onNavigatePath={setCurrentPath}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onDeleteFile={handleDeleteFile}
              onRestoreFile={handleRestoreFile}
              onPurgePermanently={handlePurgePermanently}
              onToggleSelectiveSync={handleToggleSelectiveSync}
              onOpenEditor={setEditingFile}
              currentTab={currentTab}
              searchQuery={searchQuery}
              aiSearchResults={aiSearchResults}
              aiSearchSummary={aiSearchSummary}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onUpload={() => fileInputRef.current?.click()}
            />
            {selectedFile && (
              <DetailsPanel
                selectedFile={selectedFile}
                onClose={() => setSelectedFile(null)}
                onUpdateSharing={handleUpdateSharing}
                onRestoreVersion={handleRestoreVersion}
                onDownload={handleDownloadFile}
                onToggleFavorite={handleToggleFavorite}
                favoriteIds={favoriteIds}
              />
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-1 overflow-hidden">
            <FileDrive
              files={files}
              currentPath={currentPath}
              onNavigatePath={setCurrentPath}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onDeleteFile={handleDeleteFile}
              onRestoreFile={handleRestoreFile}
              onPurgePermanently={handlePurgePermanently}
              onToggleSelectiveSync={handleToggleSelectiveSync}
              onOpenEditor={setEditingFile}
              currentTab="files"
              searchQuery={searchQuery}
              aiSearchResults={aiSearchResults}
              aiSearchSummary={aiSearchSummary}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onUpload={() => fileInputRef.current?.click()}
            />
            {selectedFile && (
              <DetailsPanel
                selectedFile={selectedFile}
                onClose={() => setSelectedFile(null)}
                onUpdateSharing={handleUpdateSharing}
                onRestoreVersion={handleRestoreVersion}
                onDownload={handleDownloadFile}
                onToggleFavorite={handleToggleFavorite}
                favoriteIds={favoriteIds}
              />
            )}
          </div>
        );
    }
  };

  // ─── Shell ────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col overflow-hidden theme-root-bg">
      {pendingUploadFile && (
        <UploadCategoryModal
          fileName={pendingUploadFile.name}
          currentTab={uploadSourceTab}
          onConfirm={handleUploadConfirm}
          onCancel={handleUploadCancel}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="px-4 py-2.5 text-xs font-semibold pointer-events-auto transition-all"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '12px',
              border: '1px solid',
              ...(
                t.type === 'success' ? { background: 'rgba(236,253,245,0.95)', borderColor: 'rgba(52,211,153,0.3)', color: '#065f46' }
                : t.type === 'error'   ? { background: 'rgba(254,242,242,0.95)', borderColor: 'rgba(239,68,68,0.3)',  color: '#991b1b' }
                : t.type === 'warning' ? { background: 'rgba(255,251,235,0.95)', borderColor: 'rgba(245,158,11,0.3)', color: '#92400e' }
                : { background: 'rgba(239,246,255,0.95)', borderColor: 'rgba(59,130,246,0.3)', color: '#1e40af' }
              ),
              boxShadow: '0 4px 24px rgba(99,102,241,0.1)'
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        files={files}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        alerts={alerts}
        onMarkAlertAsRead={handleMarkAlertAsRead}
        onClearAllAlerts={handleClearAllAlerts}
        onTriggerAISearch={handleTriggerAISearch}
        onSearchNavigate={handleSearchNavigate}
        aiSearching={aiSearching}
        storagePercent={liveStoragePercent}
        onQuickUpload={() => fileInputRef.current?.click()}
        onCreateFolder={() => setShowFolderModal(true)}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFilePicked(file);
          e.target.value = '';
        }}
      />

      {/* New folder modal (from header) */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <form onSubmit={handleCreateFolderSubmit}>
              <div className="p-5">
                <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Create New Folder</h3>
                <input
                  type="text"
                  required
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>
              <div className="px-5 py-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                <button
                  type="button"
                  onClick={() => { setShowFolderModal(false); setNewFolderName(''); }}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-white text-xs font-semibold rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', border: 'none', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(prev => !prev)}
        />
        <main className="flex-1 flex overflow-hidden">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
