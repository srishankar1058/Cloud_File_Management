/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PhotoAlbum, FileItem } from '../types';
import { Image, FolderHeart, Plus, Tag, Calendar, Eye, Trash2, Check, LayoutGrid, Folder, Sparkles } from 'lucide-react';

interface PhotoGalleryProps {
  files: FileItem[];
  albums: PhotoAlbum[];
  onCreateAlbum: (name: string, coverUrl: string) => void;
  onUpdatePhotoAlbum: (photoId: string, albumId: string) => void;
  onDeletePhoto: (photoId: string) => void;
}

export default function PhotoGallery({
  files,
  albums,
  onCreateAlbum,
  onUpdatePhotoAlbum,
  onDeletePhoto
}: PhotoGalleryProps) {
  const [view, setView] = useState<'photos' | 'albums'>('photos');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Album creation state
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumCover, setAlbumCover] = useState('');

  // Lightbox view state
  const [activePhoto, setActivePhoto] = useState<FileItem | null>(null);

  // Photos filter list
  const photos = files.filter(f => f.type === 'image' && !f.isDeleted);

  // Get all unique AI-powered organization tags (Feature 12)
  const allTags = Array.from(new Set(photos.flatMap(p => p.tags || [])));

  // Filter photos by selected conditions
  const filteredPhotos = photos.filter(p => {
    if (selectedAlbumId && p.albumId !== selectedAlbumId) return false;
    if (selectedTag && (!p.tags || !p.tags.includes(selectedTag))) return false;
    return true;
  });

  const handleCreateAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (albumName.trim()) {
      const cover = albumCover.trim() || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=60';
      onCreateAlbum(albumName.trim(), cover);
      setAlbumName('');
      setAlbumCover('');
      setShowCreateAlbum(false);
    }
  };

  // Mock unsplash image tags mappings for nice UI
  const getSimulatedUrl = (fileName: string) => {
    if (fileName.includes('rack')) {
      return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80';
    } else if (fileName.includes('scrum')) {
      return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80';
    } else {
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80';
    }
  };

  return (
    <div className="flex-1 bg-[#0c0c0e] p-6 flex flex-col h-[calc(100vh-3.5rem)] text-gray-200 overflow-y-auto select-none">
      {/* Top Gallery Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232328] pb-5 mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Image className="w-5 h-5 text-sky-400" />
            Photo Management & Backups
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            Real-time automatic device camera backup with AI photo categorization and automated albums.
          </p>
        </div>

        {/* Gallery Mode Toggles */}
        <div className="flex items-center gap-3">
          <div className="bg-[#16161a] p-1 border border-[#232328] rounded-xl flex">
            <button
              onClick={() => { setView('photos'); setSelectedAlbumId(null); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                view === 'photos' && !selectedAlbumId
                  ? 'bg-[#2a2a32] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Photos</span>
            </button>
            <button
              onClick={() => { setView('albums'); setSelectedAlbumId(null); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                view === 'albums' || selectedAlbumId
                  ? 'bg-[#2a2a32] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5" />
              <span>Albums</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateAlbum(true)}
            className="px-3.5 py-2 bg-[#005a9e] hover:bg-[#106ebe] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Album</span>
          </button>
        </div>
      </div>

      {/* Album Creation Form */}
      {showCreateAlbum && (
        <form onSubmit={handleCreateAlbumSubmit} className="bg-[#16161a] border border-[#232328] rounded-xl p-5 mb-6 space-y-4 max-w-md">
          <h3 className="font-bold text-xs text-gray-200">Create New Photo Album</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Album Name</label>
              <input
                type="text"
                required
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder="e.g. Server Snapshots 2026"
                className="w-full bg-[#0c0c0e] border border-[#232328] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Cover Image Unsplash URL (Optional)</label>
              <input
                type="text"
                value={albumCover}
                onChange={(e) => setAlbumCover(e.target.value)}
                placeholder="Enter unsplash cover URL..."
                className="w-full bg-[#0c0c0e] border border-[#232328] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono text-[11px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowCreateAlbum(false)}
              className="px-3 py-1.5 hover:bg-[#1c1c22] text-gray-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Create Album
            </button>
          </div>
        </form>
      )}

      {/* AI Tags Organization Bar (Feature 12) */}
      {view === 'photos' && allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            AI Auto-Tags:
          </div>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-full text-xs transition-all ${
              selectedTag === null
                ? 'bg-[#005a9e]/20 text-[#60a5fa] border border-[#005a9e]/40'
                : 'bg-[#16161a] hover:bg-[#25252d] border border-[#232328] text-gray-400'
            }`}
          >
            All tags
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1 ${
                tag === selectedTag
                  ? 'bg-[#005a9e]/20 text-[#60a5fa] border border-[#005a9e]/40'
                  : 'bg-[#16161a] hover:bg-[#25252d] border border-[#232328] text-gray-400'
              }`}
            >
              <Tag className="w-2.5 h-2.5" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      )}

      {/* Albums Grid View */}
      {(view === 'albums' || selectedAlbumId) && !selectedAlbumId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => { setSelectedAlbumId(album.id); setView('photos'); }}
              className="bg-[#16161a] border border-[#232328] hover:border-sky-500/30 rounded-2xl overflow-hidden cursor-pointer group shadow-lg transition-all"
            >
              <div className="h-36 overflow-hidden relative bg-[#2a2a32]">
                <img
                  src={album.coverUrl}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white font-semibold text-xs">
                  <Folder className="w-4 h-4 text-sky-400" />
                  <span>{album.name}</span>
                </div>
              </div>
              <div className="p-3 flex justify-between items-center bg-[#0e0e11] text-[11px] text-gray-500 font-medium">
                <span>Created {album.created}</span>
                <span className="font-semibold text-gray-300">{album.photoCount} photos</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Photos Grid View */
        <div>
          {selectedAlbumId && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Filtered by Album:</span>
              <span className="text-xs font-semibold bg-sky-950/40 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                {albums.find(a => a.id === selectedAlbumId)?.name}
                <button onClick={() => setSelectedAlbumId(null)} className="hover:text-white text-[10px]">×</button>
              </span>
            </div>
          )}

          {filteredPhotos.length === 0 ? (
            <div className="border border-dashed border-[#232328] rounded-2xl p-16 text-center text-gray-500 max-w-md mx-auto my-12">
              <Image className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-xs">No matching images found.</p>
              <p className="text-[11px] text-gray-600 mt-1">Images uploaded in server documentation directories or auto-backups will render here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-[#16161a] border border-[#232328] rounded-2xl overflow-hidden group shadow relative"
                >
                  {/* Photo Display */}
                  <div className="h-32 bg-[#2a2a32] relative overflow-hidden">
                    <img
                      src={getSimulatedUrl(photo.name)}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 cursor-pointer"
                      onClick={() => setActivePhoto(photo)}
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onDeletePhoto(photo.id)}
                        className="p-1.5 bg-black/60 hover:bg-red-950 text-gray-400 hover:text-red-400 rounded-lg backdrop-blur"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Details summary */}
                  <div className="p-2.5 space-y-1.5">
                    <div className="font-bold text-gray-200 text-xs truncate" title={photo.name}>{photo.name}</div>
                    
                    {/* Tags */}
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex gap-1 overflow-x-hidden text-[9px] text-sky-400">
                        {photo.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-1 bg-sky-950/20 border border-sky-500/10 rounded truncate">
                            {tag}
                          </span>
                        ))}
                        {photo.tags.length > 2 && <span className="text-gray-500">+{photo.tags.length - 2}</span>}
                      </div>
                    )}

                    {/* Album drop-down selector (Feature 12) */}
                    <div>
                      <select
                        value={photo.albumId || ''}
                        onChange={(e) => onUpdatePhotoAlbum(photo.id, e.target.value)}
                        className="w-full bg-[#0c0c0e] border border-[#232328] rounded px-1 py-0.5 mt-1 text-[10px] text-gray-400 focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value="">Move to Album...</option>
                        {albums.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Preview Dialog */}
      {activePhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full bg-[#16161a] border border-[#232328] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            {/* Close button */}
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-[#1c1c22] text-white rounded-full transition-colors z-50 cursor-pointer"
            >
              ✕
            </button>

            {/* Left image view */}
            <div className="flex-1 max-h-[500px] md:max-h-none flex items-center justify-center bg-black p-4">
              <img
                src={getSimulatedUrl(activePhoto.name)}
                alt={activePhoto.name}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            {/* Right sidebar details */}
            <div className="w-full md:w-80 bg-[#111115] p-5 border-t md:border-t-0 md:border-l border-[#232328] text-xs space-y-4">
              <div>
                <h3 className="font-bold text-gray-200 text-sm leading-tight break-all">{activePhoto.name}</h3>
                <p className="text-gray-500 mt-1">Automatic device backing snapshot</p>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">File Type:</span>
                  <span className="font-semibold text-gray-300 uppercase font-mono text-[10px]">{activePhoto.extension} Image</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dimension Status:</span>
                  <span className="font-semibold text-gray-300 font-mono">1920 × 1080 px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Image Size:</span>
                  <span className="font-semibold text-gray-300 font-mono">{activePhoto.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Backed Up Date:</span>
                  <span className="font-semibold text-gray-300">{activePhoto.modified}</span>
                </div>
              </div>

              {activePhoto.tags && activePhoto.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    AI Organizational tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activePhoto.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-sky-950/20 border border-sky-500/15 rounded text-sky-400 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#232328]">
                <button
                  onClick={() => setActivePhoto(null)}
                  className="w-full py-2 bg-[#1e293b] hover:bg-[#334155] border border-[#232328] text-gray-200 hover:text-white rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Return to Gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
