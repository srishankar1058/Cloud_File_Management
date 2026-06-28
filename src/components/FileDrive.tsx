/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileItem } from '../types';
import {
  Folder, FileText, Image, Users, Lock, ChevronRight, Star,
  Edit, Trash2, CloudCheck, CloudLightning, Sparkles, AlertCircle,
  FolderKanban, Building2, Upload, ArrowLeft
} from 'lucide-react';

interface FileDriveProps {
  files: FileItem[];
  currentPath: string;
  onNavigatePath: (path: string) => void;
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem | null) => void;
  onDeleteFile: (fileId: string) => void;
  onRestoreFile: (fileId: string) => void;
  onPurgePermanently: (fileId: string) => void;
  onToggleSelectiveSync: (fileId: string) => void;
  onOpenEditor: (file: FileItem) => void;
  currentTab: string;
  searchQuery: string;
  aiSearchResults: any[] | null;
  aiSearchSummary: string | null;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (fileId: string) => void;
  onUpload?: () => void;
}

export default function FileDrive({
  files,
  currentPath,
  onNavigatePath,
  selectedFile,
  onSelectFile,
  onDeleteFile,
  onRestoreFile,
  onPurgePermanently,
  onToggleSelectiveSync,
  onOpenEditor,
  currentTab,
  searchQuery,
  aiSearchResults,
  aiSearchSummary,
  favoriteIds = new Set(),
  onToggleFavorite,
  onUpload,
}: FileDriveProps) {
  const [sortField, setSortField] = useState<'name' | 'modified' | 'bytes'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // For Projects tab: track which project folder is open
  const [openProjectFolder, setOpenProjectFolder] = useState<FileItem | null>(null);

  const getFilteredFiles = () => {
    if (searchQuery && aiSearchResults) {
      const matchIds = aiSearchResults.map(r => r.id);
      return files.filter(f => matchIds.includes(f.id) && !f.isDeleted);
    }

    switch (currentTab) {
      case 'recycle-bin':
        return files.filter(f => f.isDeleted);

      case 'shared':
        return files.filter(f =>
          (f.sharing === 'Shared' || f.sharing === 'Public') && !f.isDeleted
        );

      case 'team-spaces':
        return files.filter(f => f.sharing === 'Team' && !f.isDeleted);

      case 'projects':
        // If a project folder is open, show its contents
        if (openProjectFolder) {
          const folderPath = openProjectFolder.path === '/'
            ? `/${openProjectFolder.name}`
            : `${openProjectFolder.path}/${openProjectFolder.name}`;
          return files.filter(f => f.path === folderPath && !f.isDeleted);
        }
        // Otherwise show root-level folders as projects
        return files.filter(f =>
          f.type === 'folder' && !f.isDeleted && f.path === '/'
        );

      case 'home':
        return files.filter(f => !f.isDeleted && f.type !== 'folder').slice(0, 5);

      case 'favorites':
        return files.filter(f => !f.isDeleted && favoriteIds.has(f.id));

      case 'recent':
        return [...files]
          .filter(f => !f.isDeleted)
          .sort((a, b) => {
            const da = new Date(a.modified).getTime();
            const db = new Date(b.modified).getTime();
            return isNaN(db) || isNaN(da) ? 0 : db - da;
          })
          .slice(0, 20);

      case 'files':
      default:
        return files.filter(f => f.path === currentPath && !f.isDeleted && !f.isVault);
    }
  };

  const filteredFiles = getFilteredFiles();

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    let valA: any = a[sortField];
    let valB: any = b[sortField];
    if (sortField === 'name') { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: 'name' | 'modified' | 'bytes') => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  // Compute a live "N items" label for folders based on direct children only.
  // Folder rows store a stale static `size` string (e.g. "0 items") set at creation
  // time, so we derive the real count here instead of trusting file.size.
  const getFolderChildPath = (folder: FileItem) =>
    folder.path === '/' ? `/${folder.name}` : `${folder.path}/${folder.name}`;

  const getFolderItemCount = (folder: FileItem) => {
    const childPath = getFolderChildPath(folder);
    return files.filter(f => f.path === childPath && !f.isDeleted).length;
  };

  const getDisplaySize = (file: FileItem) => {
    if (file.type !== 'folder') return file.size;
    const count = getFolderItemCount(file);
    return `${count} item${count === 1 ? '' : 's'}`;
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/10" />;
    if (file.type === 'image') return <Image className="w-5 h-5 text-sky-500" />;
    const ext = file.extension || 'txt';
    if (ext === 'docx') return <FileText className="w-5 h-5 text-blue-500" />;
    if (ext === 'json' || ext === 'sh') return <FileText className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  const tabTitle = (() => {
    if (currentTab === 'projects' && openProjectFolder) {
      return openProjectFolder.name;
    }
    switch (currentTab) {
      case 'recycle-bin': return 'Trash';
      case 'shared': return 'Shared';
      case 'favorites': return 'Favourites';
      case 'recent': return 'Recent';
      case 'team-spaces': return 'Team Spaces';
      case 'projects': return 'Projects';
      case 'home': return 'Home Activity';
      default: return currentPath === '/' ? 'My Files' : currentPath.split('/').pop();
    }
  })();

  const tabIcon = (() => {
    switch (currentTab) {
      case 'team-spaces': return <Building2 className="w-5 h-5 text-indigo-500" />;
      case 'projects': return <FolderKanban className="w-5 h-5 text-violet-500" />;
      default: return null;
    }
  })();

  const tabDescription = (() => {
    if (currentTab === 'projects' && openProjectFolder) {
      return `Inside project: ${openProjectFolder.name}`;
    }
    switch (currentTab) {
      case 'team-spaces': return 'Files shared with your team';
      case 'projects': return 'Top-level project folders — click a folder to open it';
      case 'favorites': return "Files you've starred";
      case 'recent': return 'Recently modified files';
      case 'shared': return 'Files shared publicly or with others';
      case 'recycle-bin': return 'Deleted files — restore or permanently remove';
      default: return null;
    }
  })();

  const renderBreadcrumbs = () => {
    if (currentTab !== 'files') return null;
    const parts = currentPath.split('/').filter(p => p);
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
        <button onClick={() => onNavigatePath('/')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
          My files
        </button>
        {parts.map((part, idx) => {
          const pathString = '/' + parts.slice(0, idx + 1).join('/');
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <button onClick={() => onNavigatePath(pathString)} className="hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[120px]">
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Handle folder click in Projects tab
  const handleProjectFolderClick = (folder: FileItem) => {
    setOpenProjectFolder(folder);
  };

  return (
    <div className="flex-1 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex flex-col h-full select-none overflow-y-auto">
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2.5">
            {/* Back button for open project folder */}
            {currentTab === 'projects' && openProjectFolder && (
              <button
                onClick={() => setOpenProjectFolder(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors mr-1"
                title="Back to Projects"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {tabIcon}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {tabTitle}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs mt-1">
            {/* Upload button inside open project folder */}
            {currentTab === 'projects' && openProjectFolder && onUpload && (
              <button
                onClick={onUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            )}
            <button
              onClick={() => toggleSort('name')}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
            >
              Sort by name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
            </button>
            <button
              onClick={() => toggleSort('modified')}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
            >
              Date {sortField === 'modified' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
            </button>
          </div>
        </div>

        {tabDescription && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{tabDescription}</p>
        )}

        {renderBreadcrumbs()}

        {/* AI Search feedback */}
        {searchQuery && (
          <div className="mb-5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Gemini Semantic Search</span>
            </div>
            {aiSearchSummary && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">{aiSearchSummary}</p>
            )}
            <div className="text-[10px] text-purple-400 font-mono">
              Query: "{searchQuery}"
            </div>
          </div>
        )}

        {/* Empty state */}
        {sortedFiles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl my-4">
            {currentTab === 'team-spaces' ? (
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            ) : currentTab === 'projects' ? (
              <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            ) : (
              <Folder className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            )}
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No items found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mt-1.5 leading-relaxed">
              {currentTab === 'team-spaces'
                ? 'Upload a file and set it to "Team Space" to see it here.'
                : currentTab === 'projects' && openProjectFolder
                  ? 'This project folder is empty. Click Upload to add files.'
                  : currentTab === 'projects'
                    ? 'Create a folder in My Files to see it here as a project.'
                    : currentTab === 'favorites'
                      ? 'Star files using the ⭐ icon to add them to favourites.'
                      : 'This folder is empty. Upload a file or create a folder to get started.'}
            </p>
            {currentTab === 'projects' && openProjectFolder && onUpload && (
              <button
                onClick={onUpload}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
            )}
          </div>
        ) : (
          /* File table */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold select-none">
                  <th className="p-3.5 pl-4">Name</th>
                  <th className="p-3.5">Modified</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Visibility</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedFiles.map((file) => {
                  const isSelected = selectedFile?.id === file.id;
                  const isFavorite = favoriteIds.has(file.id);
                  const searchItem = searchQuery && aiSearchResults?.find(r => r.id === file.id);
                  const relevance = searchItem?.relevance || null;
                  const snippet = searchItem?.snippet || null;

                  return (
                    <tr
                      key={file.id}
                      onClick={() => onSelectFile(isSelected ? null : file)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/60 dark:bg-slate-800' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file)}
                          <div className="max-w-[200px] sm:max-w-[300px] truncate">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (file.type === 'folder') {
                                  // In Projects tab: open project folder inline
                                  if (currentTab === 'projects' && !openProjectFolder) {
                                    handleProjectFolderClick(file);
                                  } else {
                                    // In My Files: navigate path
                                    onNavigatePath(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`);
                                    onSelectFile(null);
                                  }
                                } else if (['document', 'config', 'log', 'image'].includes(file.type)) {
                                  onOpenEditor(file);
                                }
                              }}
                              className="font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                            >
                              {file.name}
                            </span>
                            {relevance && (
                              <div className="text-[10px] text-purple-500 font-mono mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 shrink-0" />
                                <span>{relevance}</span>
                              </div>
                            )}
                            {snippet && (
                              <div className="text-[10px] text-slate-400 italic truncate mt-0.5">"{snippet}"</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Modified */}
                      <td className="p-3 text-slate-500 dark:text-slate-400 font-medium">{file.modified}</td>

                      {/* Size */}
                      <td className="p-3 text-slate-400 dark:text-slate-500 font-mono">{getDisplaySize(file)}</td>

                      {/* Sharing */}
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          file.sharing === 'Private'
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/20'
                          : file.sharing === 'Team'
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/10'
                          : file.sharing === 'Public'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10'
                          : 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/10'
                        }`}>
                          {file.sharing === 'Private' ? <Lock className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                          <span>{file.sharing}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right pr-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {/* Favourite toggle */}
                          {onToggleFavorite && file.type !== 'folder' && (
                            <button
                              onClick={() => onToggleFavorite(file.id)}
                              className="p-1 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded transition-colors"
                              title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                            </button>
                          )}

                          {/* Selective sync for folders */}
                          {file.type === 'folder' && (
                            <button
                              onClick={() => onToggleSelectiveSync(file.id)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
                              title={file.isSelectiveSync ? 'Synced locally' : 'Files On-Demand'}
                            >
                              {file.isSelectiveSync
                                ? <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
                                : <CloudLightning className="w-3.5 h-3.5 text-sky-500" />
                              }
                            </button>
                          )}

                          {/* Open folder in projects */}
                          {currentTab === 'projects' && file.type === 'folder' && !openProjectFolder && (
                            <button
                              onClick={() => handleProjectFolderClick(file)}
                              className="px-2 py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 border border-violet-200 dark:border-violet-500/10 rounded font-semibold text-[10px]"
                            >
                              Open
                            </button>
                          )}

                          {currentTab === 'recycle-bin' ? (
                            <>
                              <button
                                onClick={() => onRestoreFile(file.id)}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-500/10 rounded font-semibold text-[10px]"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => onPurgePermanently(file.id)}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                title="Permanently delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              {['document', 'config', 'log'].includes(file.type) && (
                                <button
                                  onClick={() => onOpenEditor(file)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                                  title="Edit file"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteFile(file.id)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded transition-colors"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trash footer */}
      {currentTab === 'recycle-bin' && sortedFiles.length > 0 && (
        <div className="mx-6 mb-6 p-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">Trash</div>
              <div className="text-slate-500 dark:text-slate-400 mt-0.5">Items stay here until you restore or permanently delete them.</div>
            </div>
          </div>
          <button
            onClick={() => sortedFiles.forEach(f => onPurgePermanently(f.id))}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all ml-4 shrink-0"
          >
            Empty Trash
          </button>
        </div>
      )}
    </div>
  );
}
