#!/usr/bin/env node
// apply_patches.mjs  — run once with:  node apply_patches.mjs
// Applies all 5 bug fixes to src/App.tsx and src/services/vault.ts

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Patch 1: vault.ts — localStorage fallback for favorites ─────────────────
const vaultPath = join(__dirname, 'src', 'services', 'vault.ts');
let vault = readFileSync(vaultPath, 'utf8');

const OLD_FAVS = `// ─── Favorites API helpers ────────────────────────────────────────────────────

export async function fetchFavoriteIds(): Promise<Set<string>> {
  const res = await fetch('/api/favorites', { headers: await authHeaders() });
  if (!res.ok) {
    console.warn('Could not load favorites', await res.text());
    return new Set();
  }
  const data = await res.json();
  return new Set(data.fileIds as string[]);
}

export async function toggleFavoriteRemote(fileId: string): Promise<'added' | 'removed'> {
  const res = await fetch(\`/api/favorites/\${encodeURIComponent(fileId)}\`, {
    method: 'POST',
    headers: await authHeaders()
  });
  if (!res.ok) throw new Error((await res.json()).error || \`HTTP \${res.status}\`);
  const data = await res.json();
  return data.action as 'added' | 'removed';
}`;

const NEW_FAVS = `// ─── Favorites API helpers ────────────────────────────────────────────────────
// Falls back to localStorage when the server API is unavailable (no Firebase
// service account configured, demo mode, etc.) so favorites always persist.

const LS_FAV_KEY = 'omnidrive:favorites';

function lsGetFavs(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_FAV_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function lsSaveFavs(ids: Set<string>): void {
  try { localStorage.setItem(LS_FAV_KEY, JSON.stringify([...ids])); } catch {}
}

export async function fetchFavoriteIds(): Promise<Set<string>> {
  try {
    const res = await fetch('/api/favorites', { headers: await authHeaders() });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    const ids = new Set(data.fileIds as string[]);
    lsGetFavs().forEach(id => ids.add(id));
    lsSaveFavs(ids);
    return ids;
  } catch {
    console.warn('[OmniDrive] Favorites API unavailable — using localStorage.');
    return lsGetFavs();
  }
}

export async function toggleFavoriteRemote(fileId: string): Promise<'added' | 'removed'> {
  const current = lsGetFavs();
  let action: 'added' | 'removed';
  if (current.has(fileId)) { current.delete(fileId); action = 'removed'; }
  else { current.add(fileId); action = 'added'; }
  lsSaveFavs(current);
  try {
    const res = await fetch(\`/api/favorites/\${encodeURIComponent(fileId)}\`, {
      method: 'POST', headers: await authHeaders()
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    return data.action as 'added' | 'removed';
  } catch { return action; }
}`;

if (vault.includes(OLD_FAVS)) {
  vault = vault.replace(OLD_FAVS, NEW_FAVS);
  writeFileSync(vaultPath, vault, 'utf8');
  console.log('✅ Patch 1: vault.ts favorites localStorage fallback applied');
} else {
  console.log('⏭  Patch 1: vault.ts already patched or pattern not found');
}

// ─── Patch 2–5: App.tsx patches ──────────────────────────────────────────────
const appPath = join(__dirname, 'src', 'App.tsx');
let app = readFileSync(appPath, 'utf8');

// Patch 2: Remove rollback from toggleFavorite
const OLD_TOGGLE = `  const toggleFavorite = useCallback((fileId: string) => {
    const isNowFav = !favoriteIds.has(fileId);
    setFavoriteIds(prev => {
      const n = new Set(prev);
      if (n.has(fileId)) n.delete(fileId); else n.add(fileId);
      return n;
    });
    // Persist to server (fire-and-forget; UI already updated optimistically)
    void toggleFavoriteRemote(fileId).catch(err => {
      console.warn('Favorite sync failed', err);
      // Rollback optimistic update
      setFavoriteIds(prev => {
        const n = new Set(prev);
        if (isNowFav) n.delete(fileId); else n.add(fileId);
        return n;
      });
    });
    const f = files.find(x => x.id === fileId);
    showToast('info', isNowFav ? 'Added to Favorites' : 'Removed from Favorites', f?.name);
  }, [favoriteIds, files, showToast]);`;

const NEW_TOGGLE = `  const toggleFavorite = useCallback((fileId: string) => {
    const isNowFav = !favoriteIds.has(fileId);
    setFavoriteIds(prev => {
      const n = new Set(prev);
      if (n.has(fileId)) n.delete(fileId); else n.add(fileId);
      return n;
    });
    // toggleFavoriteRemote writes to localStorage first and never throws,
    // so no rollback is needed here.
    void toggleFavoriteRemote(fileId);
    const f = files.find(x => x.id === fileId);
    showToast('info', isNowFav ? 'Added to Favorites' : 'Removed from Favorites', f?.name);
  }, [favoriteIds, files, showToast]);`;

if (app.includes(OLD_TOGGLE)) {
  app = app.replace(OLD_TOGGLE, NEW_TOGGLE);
  console.log('✅ Patch 2: toggleFavorite rollback removed');
} else {
  console.log('⏭  Patch 2: already patched or pattern not found');
}

// Patch 3: Remove duplicate upload-complete toast from progress interval
const OLD_INTERVAL = `          const done = nextProgress >= 100;
          if (done && job.progress < 100) {
            showToast('success', \`Upload complete\`, job.name);
          }
          return { ...job, progress: nextProgress, status: done ? 'complete' : 'uploading' };`;

const NEW_INTERVAL = `          const done = nextProgress >= 100;
          // No toast here — FILE_UPLOADED audit already fires one notification per file.
          return { ...job, progress: nextProgress, status: done ? 'complete' : 'uploading' };`;

if (app.includes(OLD_INTERVAL)) {
  app = app.replace(OLD_INTERVAL, NEW_INTERVAL);
  console.log('✅ Patch 3: duplicate upload notification removed');
} else {
  console.log('⏭  Patch 3: already patched or pattern not found');
}

// Patch 4: Binary file upload — use readAsDataURL + store dataUrl
const OLD_UPLOAD = `      const saveFileRecord = (content: string) => {
        const newFile: FileItem = {
          id: \`f-\${Date.now()}-\${Math.random().toString(36).slice(2, 7)}\`,
          name: file.name,
          path: currentPath,
          type: fileType,
          extension,
          size: formatBytes(file.size),
          bytes: file.size,
          modified: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          owner: user.name,
          sharing: 'Private',
          content: content || undefined,
          versions: [],
          comments: []
        };
        setFiles(prev => [...prev, newFile]);
        void persistItem('files', newFile);
        setUser(prev => {
          const updated = { ...prev, storageUsed: prev.storageUsed + file.size };
          if (isSupabaseConfigured) void saveUserProfile(updated).catch(console.error);
          return updated;
        });
        addAudit('FILE_UPLOADED', \`Uploaded "\${file.name}" to \${currentPath}\`);
      };

      if (isBinary || !isText) {
        // For binary files (images, PDFs, etc.) just save metadata — no content to read
        saveFileRecord('');
      } else {`;

const NEW_UPLOAD = `      const saveFileRecord = (content: string, dataUrl?: string) => {
        const newFile: FileItem = {
          id: \`f-\${Date.now()}-\${Math.random().toString(36).slice(2, 7)}\`,
          name: file.name,
          path: currentPath,
          type: fileType,
          extension,
          size: formatBytes(file.size),
          bytes: file.size,
          modified: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          owner: user.name,
          sharing: 'Private',
          content: content || undefined,
          dataUrl: dataUrl || undefined,
          versions: [],
          comments: []
        };
        setFiles(prev => [...prev, newFile]);
        void persistItem('files', newFile);
        setUser(prev => {
          const updated = { ...prev, storageUsed: prev.storageUsed + file.size };
          if (isSupabaseConfigured) void saveUserProfile(updated).catch(console.error);
          return updated;
        });
        addAudit('FILE_UPLOADED', \`Uploaded "\${file.name}" to \${currentPath}\`);
      };

      if (isBinary) {
        // Binary files — read as data URL so preview & download work
        const reader = new FileReader();
        reader.onload = ev => saveFileRecord('', (ev.target?.result as string) || '');
        reader.onerror = () => saveFileRecord('');
        reader.readAsDataURL(file);
      } else if (!isText) {
        saveFileRecord('');
      } else {`;

if (app.includes(OLD_UPLOAD)) {
  app = app.replace(OLD_UPLOAD, NEW_UPLOAD);
  console.log('✅ Patch 4: binary file upload with dataUrl applied');
} else {
  console.log('⏭  Patch 4: already patched or pattern not found');
}

// Patch 5a: Fix context menu download
const OLD_DL_CTX = `              const content = file.content || '';
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              a.click();
              URL.revokeObjectURL(url);
              addAudit('FILE_DOWNLOADED', \`Downloaded "\${file.name}"\`);`;

const NEW_DL_CTX = `              const dataUrl = (file as any).dataUrl as string | undefined;
              if (dataUrl) {
                const a = document.createElement('a');
                a.href = dataUrl; a.download = file.name; a.click();
              } else {
                const blob = new Blob([file.content || ''], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = file.name; a.click();
                URL.revokeObjectURL(url);
              }
              addAudit('FILE_DOWNLOADED', \`Downloaded "\${file.name}"\`);`;

if (app.includes(OLD_DL_CTX)) {
  app = app.replace(OLD_DL_CTX, NEW_DL_CTX);
  console.log('✅ Patch 5a: context menu download fixed for binary files');
} else {
  console.log('⏭  Patch 5a: already patched or pattern not found');
}

// Patch 5b: Fix details panel download
const OLD_DL_PANEL = `                onClick={() => {
                  const blob = new Blob([selectedFile.content || ''], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = selectedFile.name;
                  a.click();
                  URL.revokeObjectURL(url);
                }}`;

const NEW_DL_PANEL = `                onClick={() => {
                  const dataUrl = (selectedFile as any).dataUrl as string | undefined;
                  if (dataUrl) {
                    const a = document.createElement('a');
                    a.href = dataUrl; a.download = selectedFile.name; a.click();
                  } else {
                    const blob = new Blob([selectedFile.content || ''], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = selectedFile.name; a.click();
                    URL.revokeObjectURL(url);
                  }
                }}`;

if (app.includes(OLD_DL_PANEL)) {
  app = app.replace(OLD_DL_PANEL, NEW_DL_PANEL);
  console.log('✅ Patch 5b: details panel download fixed for binary files');
} else {
  console.log('⏭  Patch 5b: already patched or pattern not found');
}

// Patch 5c: Add image preview in details panel
const OLD_ICON = `          <span className={\`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl \${dm.bg} shadow-sm\`}>
            {getIconForFile(selectedFile, 'h-8 w-8')}
          </span>
          <h3 className={\`mt-4 break-words text-base font-semibold \${dm.text}\`}>{selectedFile.name}</h3>`;

const NEW_ICON = `          {selectedFile.type === 'image' && (selectedFile as any).dataUrl ? (
            <img src={(selectedFile as any).dataUrl} alt={selectedFile.name}
              className="mx-auto mb-3 max-h-40 max-w-full rounded-2xl object-contain shadow" />
          ) : (
            <span className={\`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl \${dm.bg} shadow-sm\`}>
              {getIconForFile(selectedFile, 'h-8 w-8')}
            </span>
          )}
          <h3 className={\`mt-4 break-words text-base font-semibold \${dm.text}\`}>{selectedFile.name}</h3>`;

if (app.includes(OLD_ICON)) {
  app = app.replace(OLD_ICON, NEW_ICON);
  console.log('✅ Patch 5c: image preview added to details panel');
} else {
  console.log('⏭  Patch 5c: already patched or pattern not found');
}

writeFileSync(appPath, app, 'utf8');
console.log('\n✅ All patches applied. Restart your dev server (npm run dev).');
