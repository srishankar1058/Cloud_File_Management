/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { FileItem, CommentItem } from '../types';
import {
  Save, ArrowLeft, MessageSquare, Send, Sparkles, FileCode,
  FileText, Image as ImageIcon, File
} from 'lucide-react';

interface DocumentEditorProps {
  file: FileItem;
  onSave: (fileId: string, updatedContent: string, commitNote?: string) => void;
  onClose: () => void;
  onAddComment: (fileId: string, commentText: string) => void;
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

async function callAnthropicAPI(prompt: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  if (data?.content?.[0]?.text) return data.content[0].text;
  throw new Error('No response from AI');
}

export default function DocumentEditor({
  file,
  onSave,
  onClose,
  onAddComment
}: DocumentEditorProps) {
  const [content, setContent] = useState(file.content || '');
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving' | 'Unsaved'>('Saved');
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // AI assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  // AI "About this file" auto-analysis
  const [autoAiResult, setAutoAiResult] = useState('');
  const [autoAiLoading, setAutoAiLoading] = useState(false);
  const [autoAiDone, setAutoAiDone] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live comments from file state
  const comments: CommentItem[] = file.comments || [];

  // Auto-save
  useEffect(() => {
    if (content !== (file.content || '')) {
      setSaveStatus('Unsaved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('Saving');
        setTimeout(() => {
          onSave(file.id, content, 'Auto-saved session backup');
          setSaveStatus('Saved');
        }, 1000);
      }, 2500);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [content, file.id, onSave]);

  // Auto-analyze file with Anthropic on open
  useEffect(() => {
    if (autoAiDone) return;
    setAutoAiDone(true);

    const fileContent = file.content;
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;

    if (!fileContent && !file.dataUrl) return;

    setAutoAiLoading(true);
    const prompt = fileContent
      ? `You are a helpful file assistant. The user opened a file named "${fileName}". Here is its content:\n\n${fileContent.slice(0, 3000)}\n\nGive a brief, helpful summary (2–3 sentences): what this file is, what it contains, and one suggestion for the user.`
      : `You are a helpful file assistant. The user opened a file named "${fileName}" (type: ${fileType}, size: ${fileSize}). Describe what this file likely is and what the user might do with it in 2–3 sentences.`;

    callAnthropicAPI(prompt)
      .then(text => setAutoAiResult(text))
      .catch(() => setAutoAiResult('Could not analyze file — AI unavailable.'))
      .finally(() => setAutoAiLoading(false));
  }, [file.id]);

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('Saving');
    setTimeout(() => {
      onSave(file.id, content, 'Manual revision checkpoint');
      setSaveStatus('Saved');
    }, 800);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(file.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAI(true);
    setAiResult('');
    try {
      const prompt = `You are an AI co-author assistant. The user is working on a file named "${file.name}".${content ? `\n\nFile content (excerpt):\n${content.slice(0, 1000)}` : ''}\n\nUser request: ${aiPrompt}\n\nRespond helpfully and concisely.`;
      const text = await callAnthropicAPI(prompt);
      setAiResult(text);
    } catch {
      setAiResult('Error generating content. AI unavailable.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const insertAICodeAtEnd = () => {
    if (aiResult) {
      setContent(prev => prev + '\n\n' + aiResult);
      setAiResult('');
      setAiPrompt('');
    }
  };

  // Render file preview based on type
  const renderPreview = () => {
    // IMAGE preview
    if (file.type === 'image' && file.dataUrl) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-[#111115] overflow-auto">
          <img
            src={file.dataUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-xl border border-[#232328] shadow-2xl"
          />
        </div>
      );
    }

    // TEXT / DOCUMENT preview
    if (file.content) {
      const ext = (file.extension || '').toLowerCase();
      const isCode = ['js','ts','tsx','jsx','py','sh','json','yaml','yml','toml','env',
        'conf','cfg','ini','xml','html','css','sql','rs','go','cpp','c','java','rb','php'].includes(ext);

      if (activeTab === 'preview' && !isCode) {
        // Rich text preview for documents
        return (
          <div className="flex-1 overflow-y-auto bg-[#111115] p-6">
            <div className="max-w-3xl mx-auto bg-[#16161a] border border-[#232328] rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#232328]">
                <FileText className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-base font-bold text-gray-100">{file.name}</h2>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">{file.size} · {file.modified} · {file.owner}</p>
                </div>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                {file.content}
              </div>
            </div>
          </div>
        );
      }

      // Code/edit textarea
      return (
        <div className="flex-1 flex flex-col p-4 bg-[#111115] overflow-hidden">
          <div className="max-w-3xl w-full mx-auto bg-[#16161a] border border-[#232328] rounded-2xl shadow-xl flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 bg-[#0c0c0e] border-b border-[#232328] rounded-t-2xl flex items-center gap-3 text-xs text-gray-400 font-mono shrink-0">
              <span className="font-semibold text-gray-300 uppercase text-[9px]">File Editor</span>
              <span className="text-gray-600">|</span>
              <span>Encrypted with AES-256</span>
              <span className="text-gray-600">|</span>
              <span>Lines: {content.split('\n').length}</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start editing..."
              className="flex-1 w-full bg-[#16161a] rounded-b-2xl p-6 text-sm text-gray-300 placeholder-gray-600 border-none outline-none focus:ring-0 leading-relaxed font-mono resize-none"
            />
          </div>
        </div>
      );
    }

    // Binary file with no preview
    return (
      <div className="flex-1 flex items-center justify-center bg-[#111115]">
        <div className="text-center space-y-4 p-8">
          <div className="w-20 h-20 mx-auto bg-[#16161a] border border-[#232328] rounded-2xl flex items-center justify-center">
            <File className="w-10 h-10 text-slate-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-200">{file.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{file.size} · {file.type?.toUpperCase()}</p>
          </div>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
            Preview not available for this file type. Use the download option to open it in its native application.
          </p>
        </div>
      </div>
    );
  };

  const ext = (file.extension || '').toLowerCase();
  const isCode = ['js','ts','tsx','jsx','py','sh','json','yaml','yml','toml','env',
    'conf','cfg','ini','xml','html','css','sql','rs','go','cpp','c','java','rb','php'].includes(ext);
  const canEdit = !!file.content;
  const isImage = file.type === 'image';

  return (
    <div className="flex-1 bg-[#0c0c0e] flex flex-col h-[calc(100vh-3.5rem)] text-gray-200 overflow-hidden">
      {/* Editor Header */}
      <div className="h-14 border-b border-[#232328] bg-[#111114] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-[#1c1c22] rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-100">{file.name}</h2>
              {canEdit && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  saveStatus === 'Saved' ? 'bg-emerald-500/10 text-emerald-400' :
                  saveStatus === 'Saving' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {saveStatus}
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{file.size} · {file.modified} · {file.owner}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Preview / Edit toggle (only for text files, not code) */}
          {canEdit && !isCode && (
            <div className="flex bg-[#16161a] border border-[#232328] rounded-lg p-0.5 text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'edit' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Edit
              </button>
            </div>
          )}
          {canEdit && (
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'Saving'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005a9e] hover:bg-[#106ebe] text-white rounded-lg text-xs font-semibold transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Revision</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Preview / Editor area */}
        {renderPreview()}

        {/* Right sidebar: AI + Comments */}
        <div className="w-80 bg-[#111115] border-l border-[#232328] flex flex-col h-full overflow-hidden shrink-0">
          {/* AI Copilot Section */}
          <div className="border-b border-[#232328] bg-[#0c0c0e] text-xs font-semibold shrink-0">
            <div className="flex-1 text-center py-3 text-purple-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* AI Section */}
            <div className="p-4 space-y-4 border-b border-[#232328]">
              {/* Auto file analysis */}
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">About this file</div>
                {autoAiLoading ? (
                  <div className="p-3 bg-[#16161a] border border-purple-500/10 rounded-xl text-[11px] text-gray-400 animate-pulse">
                    Analyzing file with AI...
                  </div>
                ) : autoAiResult ? (
                  <div className="p-3 bg-[#16161a] border border-purple-500/20 rounded-xl text-[11px] text-gray-300 leading-relaxed">
                    {autoAiResult}
                  </div>
                ) : null}
              </div>

              {/* Custom AI prompt */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Ask AI Co-Author</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={`e.g., 'Write a python script to parse memory alerts' or 'rewrite the objectives section more professionally'`}
                  className="w-full h-20 bg-[#16161a] border border-[#232328] rounded-xl p-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                />
                <button
                  onClick={handleAIGenerate}
                  disabled={generatingAI || !aiPrompt.trim()}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingAI ? 'Generating...' : 'Ask AI'}</span>
                </button>
              </div>

              {aiResult && (
                <div className="p-3 bg-[#16161a] border border-purple-500/20 rounded-xl space-y-2">
                  <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" />
                    AI Response
                  </div>
                  <pre className="text-[10px] text-gray-300 font-mono bg-[#0c0c0e] p-2 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-40">
                    {aiResult}
                  </pre>
                  {canEdit && (
                    <button
                      onClick={insertAICodeAtEnd}
                      className="w-full py-1 bg-purple-900/40 hover:bg-purple-900/80 border border-purple-500/20 text-purple-200 rounded text-[10px] font-bold transition-all"
                    >
                      Append to Document
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Discussion Comments Section */}
            <div className="p-4 space-y-3">
              <div className="font-semibold text-gray-300 text-xs flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Discussion Comments
                {comments.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[9px] font-bold">
                    {comments.length}
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-[10px] text-gray-500 italic p-3 text-center bg-[#16161a] rounded-lg">
                    No active comments on this revision checkout. Type below to start thread.
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="p-2.5 bg-[#16161a] border border-[#232328] rounded-xl text-[11px]">
                      <div className="flex items-center justify-between font-bold text-gray-200 mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center text-[9px] font-bold text-white">
                            {c.avatar}
                          </div>
                          <span>{c.user}</span>
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono">{c.timestamp}</span>
                      </div>
                      <p className="text-gray-400 leading-normal pl-6">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Post comments to team..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-[#16161a] border border-[#232328] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3b82f6]"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-1.5 bg-[#005a9e] hover:bg-[#106ebe] disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
