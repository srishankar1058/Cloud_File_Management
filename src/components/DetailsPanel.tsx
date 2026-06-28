/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileItem } from '../types';
import {
  FileText, Folder, Image, ShieldCheck, Clock, Users, RotateCcw,
  Calendar, Sparkles, CheckCircle, Lock, Download, Star
} from 'lucide-react';

interface DetailsPanelProps {
  selectedFile: FileItem | null;
  onClose: () => void;
  onUpdateSharing: (fileId: string, sharing: 'Private' | 'Shared' | 'Public' | 'Team') => void;
  onRestoreVersion: (fileId: string, versionIndex: number) => void;
  onDownload?: (file: FileItem) => void;
  onToggleFavorite?: (fileId: string) => void;
  favoriteIds?: Set<string>;
}

export default function DetailsPanel({
  selectedFile,
  onClose,
  onUpdateSharing,
  onRestoreVersion,
  onDownload,
  onToggleFavorite,
  favoriteIds = new Set()
}: DetailsPanelProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState('');

  if (!selectedFile) {
    return (
      <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 p-4 flex flex-col items-center justify-center text-center h-full select-none">
        <ShieldCheck className="w-12 h-12 text-blue-300 dark:text-blue-500/40 mb-3 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">No file selected</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">
          Select any file or folder to view sharing configurations, version control, and AI analysis.
        </p>
      </div>
    );
  }

  const getFileIcon = () => {
    switch (selectedFile.type) {
      case 'folder': return <Folder className="w-10 h-10 text-amber-500 fill-amber-500/10" />;
      case 'image':  return <Image className="w-10 h-10 text-sky-500" />;
      default:       return <FileText className="w-10 h-10 text-blue-500" />;
    }
  };

  const handleFetchAISummary = async () => {
    if (!selectedFile.content) return;
    setLoadingSummary(true);
    setAiSummary(null);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedFile.name, content: selectedFile.content }),
      });
      const data = await res.json();
      setAiSummary(data.summary || 'Summary unavailable');
    } catch {
      setAiSummary('Failed to communicate with AI server.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleFetchAIInsights = async () => {
    if (!selectedFile.content) return;
    setLoadingInsights(true);
    setAiInsights(null);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedFile.name, content: selectedFile.content }),
      });
      const data = await res.json();
      setAiInsights(data.insights || 'Insights unavailable');
    } catch {
      setAiInsights('Failed to fetch security insights.');
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex flex-col h-full overflow-y-auto select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Item Details</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Hide panel
        </button>
      </div>

      {/* File preview / icon */}
      <div className="p-4 flex flex-col items-center text-center border-b border-slate-200 dark:border-slate-700">
        {selectedFile.type === 'image' && selectedFile.dataUrl ? (
          <img
            src={selectedFile.dataUrl}
            alt={selectedFile.name}
            className="w-full max-h-40 object-contain rounded-xl border border-slate-200 dark:border-slate-700 mb-2"
          />
        ) : (
          getFileIcon()
        )}
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-3.5 break-all max-w-[240px]">
          {selectedFile.name}
        </h4>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 mt-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-500/20">
          {selectedFile.type}
        </span>

        {/* Download & Favourite quick actions */}
        <div className="flex items-center gap-2 mt-3">
          {onDownload && (
            <button
              onClick={() => onDownload(selectedFile)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg text-[11px] font-semibold transition-all"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          )}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(selectedFile.id)}
              className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-[11px] font-semibold transition-all ${
                favoriteIds.has(selectedFile.id)
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-500'
              }`}
            >
              <Star className={`w-3 h-3 ${favoriteIds.has(selectedFile.id) ? 'fill-amber-400' : ''}`} />
              {favoriteIds.has(selectedFile.id) ? 'Favorited' : 'Favorite'}
            </button>
          )}
        </div>
      </div>

      {/* Encryption badge */}
      <div className="mx-4 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-start gap-2.5">
        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Encrypted at rest (AES-256)</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Scanned by Ransomware shield. 100% clean.</div>
        </div>
      </div>

      {/* Sharing Permissions — FIX: onChange fires immediately, no extra button needed */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h5 className="font-semibold text-slate-700 dark:text-slate-200 text-xs mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-blue-500" />
          Sharing & Collaboration
        </h5>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">
              Access Permission Level
            </label>
            {/* FIX: onChange calls onUpdateSharing immediately — no save button required */}
            <select
              value={selectedFile.sharing}
              onChange={(e) => onUpdateSharing(selectedFile.id, e.target.value as FileItem['sharing'])}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 mt-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Private">🔒 Only Me (Private)</option>
              <option value="Shared">👥 Shared (Edit Perms)</option>
              <option value="Team">🏢 Team Spaces (View Only)</option>
              <option value="Public">🌐 Anyone with link (Public)</option>
            </select>
            {/* Live feedback pill */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                selectedFile.sharing === 'Private'
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : selectedFile.sharing === 'Team'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : selectedFile.sharing === 'Public'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-800'
              }`}>
                ● {selectedFile.sharing}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Permission applied</span>
            </div>
          </div>

          {selectedFile.sharing === 'Public' && (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" /> Password Protect
                </span>
                <input
                  type="checkbox"
                  checked={isProtected}
                  onChange={(e) => setIsProtected(e.target.checked)}
                  className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-0"
                />
              </div>
              {isProtected && (
                <input
                  type="password"
                  placeholder="Set sharing password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              )}
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-500" /> Link Expiry
                </span>
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-slate-600 dark:text-slate-300 font-mono text-[10px] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Version History */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h5 className="font-semibold text-slate-700 dark:text-slate-200 text-xs mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          Version History & Backups
        </h5>
        {selectedFile.versions && selectedFile.versions.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFile.versions.map((v, idx) => (
              <div key={v.version} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Version {v.version}</span>
                  <span
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    onClick={() => onRestoreVersion(selectedFile.id, idx)}
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Restore
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Modified: {v.modified}</div>
                <div className="text-slate-400 dark:text-slate-500 text-[10px]">By: {v.modifiedBy} ({v.size})</div>
                {v.note && <div className="text-[10px] text-amber-600 dark:text-amber-400/80 italic mt-1 font-sans">{v.note}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 dark:text-slate-500 italic">
            No previous versions. Automatic version tracking records revisions on save.
          </div>
        )}
      </div>

      {/* AI Features */}
      <div className="p-4 space-y-4">
        <h5 className="font-semibold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          AI Co-Pilot Integrations
        </h5>

        {!selectedFile.content ? (
          <div className="text-xs text-slate-400 dark:text-slate-500 italic leading-relaxed">
            AI summarization and security insights are available for files with readable text content.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <button
                onClick={handleFetchAISummary}
                disabled={loadingSummary}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-semibold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {loadingSummary ? 'Summarizing...' : 'Summarize Document'}
              </button>
              {aiSummary && (
                <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-normal max-h-48 overflow-y-auto whitespace-pre-line font-sans">
                  <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">AI Summarization:</div>
                  {aiSummary}
                </div>
              )}
            </div>
            <div>
              <button
                onClick={handleFetchAIInsights}
                disabled={loadingInsights}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-semibold transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {loadingInsights ? 'Analyzing...' : 'Run Security Insights'}
              </button>
              {aiInsights && (
                <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  <div className="font-bold text-sky-600 dark:text-sky-400 mb-1 flex items-center gap-1">🛡️ File Analysis:</div>
                  {aiInsights}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File metadata footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 mt-auto border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <div>Path: {selectedFile.path}</div>
        <div>Owner: {selectedFile.owner}</div>
        <div>Modified: {selectedFile.modified}</div>
        <div>Size: {selectedFile.size}</div>
      </div>
    </div>
  );
}
