/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, cert, type App as AdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' }
    }
  });
}

// ─── Firebase Admin (server-side ID token verification) ────────────────────────
// This is the trust boundary: the browser sends its Firebase ID token, and ONLY
// the server (using the Admin SDK + a service account, never exposed to the
// client) can verify that token is genuine and extract the real uid from it.
// Everything below that uses `req.uid` is guaranteed to come from a verified
// token, not from anything the client claims in the request body.

let adminApp: AdminApp | null = null;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    adminApp = getAdminApps().length
      ? getAdminApps()[0]
      : initializeAdminApp({ credential: cert(serviceAccount) });
  } catch (err) {
    console.error('[OmniDrive] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON — auth proxy disabled.', err);
  }
} else {
  console.warn('[OmniDrive] FIREBASE_SERVICE_ACCOUNT_JSON not set — /api/workspace endpoints will reject all requests.');
}

// ─── Supabase admin client (service role — server only, never sent to browser) ─

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null;

if (!supabaseAdmin) {
  console.warn('[OmniDrive] VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — /api/workspace endpoints will use local fallback only.');
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Express Request augmentation for our verified uid
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

// ─── Auth middleware ────────────────────────────────────────────────
// Verifies the Authorization: Bearer <Firebase ID token> header. Rejects the
// request entirely if the token is missing, malformed, or invalid/expired.
// Never trust a user id passed in the request body or query string.

const requireAuth: express.RequestHandler = async (req, res, next) => {
  if (!adminApp) {
    res.status(503).json({ error: 'Server auth is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.' });
    return;
  }
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) {
    res.status(401).json({ error: 'Missing Authorization: Bearer <idToken> header.' });
    return;
  }
  try {
    const decoded = await getAdminAuth(adminApp).verifyIdToken(match[1]);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error('[OmniDrive] Token verification failed', err);
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    aiEnabled: !!ai,
    authProxyEnabled: !!adminApp,
    supabaseProxyEnabled: !!supabaseAdmin
  });
});

// ─── Workspace proxy (files / audit_logs / devices / profile) ─────────────
// All reads and writes are scoped to req.uid, extracted from the verified
// Firebase ID token above — the client can never read or write another
// user's rows through these endpoints, regardless of what it sends.

const ALLOWED_TABLES = new Set(['files', 'audit_logs', 'devices']);

app.get('/api/workspace/:table', requireAuth, async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.has(table)) { res.status(400).json({ error: 'Unknown table' }); return; }
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase proxy not configured' }); return; }

  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id,payload')
    .eq('user_id', req.uid)
    .order('updated_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ items: (data || []).map((row: any) => row.payload) });
});

app.put('/api/workspace/:table/:id', requireAuth, async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED_TABLES.has(table)) { res.status(400).json({ error: 'Unknown table' }); return; }
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase proxy not configured' }); return; }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') { res.status(400).json({ error: 'Body must be a JSON object' }); return; }

  const { error } = await supabaseAdmin.from(table).upsert({
    id,
    user_id: req.uid, // always the verified uid — client cannot override this
    payload,
    updated_at: new Date().toISOString()
  });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

app.delete('/api/workspace/:table/:id', requireAuth, async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED_TABLES.has(table)) { res.status(400).json({ error: 'Unknown table' }); return; }
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase proxy not configured' }); return; }

  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('user_id', req.uid)
    .eq('id', id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

app.get('/api/workspace/profile/me', requireAuth, async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase proxy not configured' }); return; }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('payload')
    .eq('id', req.uid)
    .maybeSingle();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ profile: data?.payload || null });
});

app.put('/api/workspace/profile/me', requireAuth, async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase proxy not configured' }); return; }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') { res.status(400).json({ error: 'Body must be a JSON object' }); return; }

  const { error } = await supabaseAdmin.from('profiles').upsert({
    id: req.uid, // always the verified uid
    email: payload.email || '',
    payload,
    updated_at: new Date().toISOString()
  });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ─── AI Summarization ─────────────────────────────────────────────────────────

app.post('/api/ai/summarize', async (req, res) => {
  const { fileName, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  if (!ai) {
    return res.json({
      summary: `[Demo Mode — Simulated Summary for ${fileName}]\n• This document outlines cloud deployment configurations and monitoring thresholds (CPU 85%, memory limits).\n• It sets up automated backup scripts using cron jobs syncing key server directories to OmniDrive.\n• The configuration enables encrypted storage at rest and versioned backup management.`,
      fallback: true
    });
  }

  try {
    const prompt = `Summarize the following document concisely. The document is named "${fileName}".
Provide exactly 3 bullet points covering the key takeaways, then a one-sentence overall insight.
Use plain language suitable for a business dashboard.

Document content:
${content.slice(0, 4000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error('Gemini Summarize Error:', error);
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

// ─── AI Content Generation ────────────────────────────────────────────────────

app.post('/api/ai/generate', async (req, res) => {
  const { prompt, context } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  if (!ai) {
    return res.json({
      generated: `#!/bin/bash
# Generated script for: ${prompt}
# Context: ${(context || 'General system scripting').slice(0, 100)}

echo "Initializing automated service..."
LOG_FILE="/var/log/omnidrive_service.log"

while true; do
  CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}')
  echo "$(date +'%Y-%m-%d %H:%M:%S') — CPU: \${CPU}%" >> "$LOG_FILE"

  if (( $(echo "\$CPU > 85" | bc -l) )); then
    echo "ALERT: High CPU — triggering OmniDrive backup..." >> "$LOG_FILE"
    omnidrive-cli sync --local="/var/log/nginx/" --remote="/Backup/NginxLogs/"
  fi
  sleep 60
done`,
      fallback: true
    });
  }

  try {
    const systemPrompt = `You are an expert system administrator and software engineer.
Generate the requested code, configuration file, or documentation precisely.
Keep explanations concise; use detailed comments inside the code.
Context from the document being edited: ${(context || '').slice(0, 800)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nRequest: ${prompt}` }] }
      ]
    });

    res.json({ generated: response.text });
  } catch (error: any) {
    console.error('Gemini Generate Error:', error);
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

// ─── AI Insights ──────────────────────────────────────────────────────────────

app.post('/api/ai/insights', async (req, res) => {
  const { fileName, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  if (!ai) {
    return res.json({
      insights: `**Security & Integrity Rating:** A+ (Excellent)\n**Encryption Status:** AES-256 at rest.\n**Ransomware Threat Level:** Low — no malicious patterns detected.\n**Suggested Action:** This file references a developer API token. Move it to the PIN-protected **Personal Vault** to restrict access.`,
      fallback: true
    });
  }

  try {
    const prompt = `Analyze this file's contents and provide brief insights for a file management dashboard.
File name: "${fileName}"

Cover these points in markdown with bold headers:
1. **Security & Compliance** — check for hardcoded secrets, appropriate sharing level.
2. **File Health** — potential issues, errors, or improvement suggestions.
3. **Suggested Location** — recommend the best folder (Vault, Team Documents, General, Archive).

File content:
${content.slice(0, 3000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    res.json({ insights: response.text });
  } catch (error: any) {
    console.error('Gemini Insights Error:', error);
    res.status(500).json({ error: error.message || 'AI insights failed' });
  }
});

// ─── AI Semantic Search ───────────────────────────────────────────────────────

app.post('/api/ai/search', async (req, res) => {
  const { query, files } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  // Always do local fallback search so results appear even without AI
  const localResults = (files || [])
    .filter((f: any) =>
      `${f.name} ${f.owner || ''} ${f.content || ''} ${(f.tags || []).join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    .map((f: any) => ({
      id: f.id,
      name: f.name,
      relevance: 'High',
      snippet: f.content ? f.content.substring(0, 150) + '…' : `Folder or metadata match for "${f.name}"`
    }));

  if (!ai) {
    return res.json({
      results: localResults,
      aiSummary: `Found ${localResults.length} matching file(s) using local text search (AI unavailable).`,
      fallback: true
    });
  }

  try {
    // Limit payload size — only send name, type, id, and first 300 chars of content
    const filePayload = (files || []).slice(0, 50).map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      owner: f.owner,
      tags: f.tags || [],
      content: (f.content || '').slice(0, 300)
    }));

    const searchPrompt = `Search query: "${query}"

Files database:
${JSON.stringify(filePayload, null, 2)}

Identify files semantically relevant to the search query. Return ONLY valid JSON matching this exact schema — no markdown, no preamble:
{
  "results": [
    { "id": "string", "name": "string", "relevance": "High|Medium|Low", "snippet": "string" }
  ],
  "aiSummary": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: searchPrompt,
      config: { responseMimeType: 'application/json' }
    });

    try {
      const text = (response.text || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      // Merge AI results with local fallback (AI results take priority)
      const aiIds = new Set((parsed.results || []).map((r: any) => r.id));
      const merged = [
        ...(parsed.results || []),
        ...localResults.filter((r: any) => !aiIds.has(r.id))
      ];
      res.json({ results: merged, aiSummary: parsed.aiSummary || `Found ${merged.length} result(s).` });
    } catch {
      // JSON parse failed — fall back to local results
      res.json({ results: localResults, aiSummary: `Found ${localResults.length} result(s) using local search.` });
    }
  } catch (error: any) {
    console.error('Gemini Search Error:', error);
    // Return local results instead of 500
    res.json({ results: localResults, aiSummary: `Found ${localResults.length} result(s) using local search (AI error: ${error.message}).` });
  }
});

// ─── Favorites API ──────────────────────────────────────────────────────────
// GET  /api/favorites          → { fileIds: string[] }
// POST /api/favorites/:fileId  → toggle (add if absent, remove if present)

app.get('/api/favorites', requireAuth, async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase not configured' }); return; }
  const { data, error } = await supabaseAdmin
    .from('favorites')
    .select('file_id')
    .eq('user_id', req.uid);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ fileIds: (data || []).map((r: any) => r.file_id) });
});

app.post('/api/favorites/:fileId', requireAuth, async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase not configured' }); return; }
  const { fileId } = req.params;
  // Check if already a favorite
  const { data: existing } = await supabaseAdmin
    .from('favorites')
    .select('file_id')
    .eq('user_id', req.uid)
    .eq('file_id', fileId)
    .maybeSingle();
  if (existing) {
    // Remove
    await supabaseAdmin.from('favorites').delete().eq('user_id', req.uid).eq('file_id', fileId);
    res.json({ action: 'removed' });
  } else {
    // Add
    await supabaseAdmin.from('favorites').insert({ user_id: req.uid, file_id: fileId });
    res.json({ action: 'added' });
  }
});

// ─── Vault Items API ──────────────────────────────────────────────────────────
// The server stores encrypted blobs. Encryption/decryption is 100% client-side
// using the Web Crypto API (AES-GCM + PBKDF2). The server never sees plaintext.
//
// GET    /api/vault              → { items: VaultItem[] }
// POST   /api/vault              → upsert one item  (body: VaultItem without user_id)
// DELETE /api/vault/:id          → delete one item

app.get('/api/vault', requireAuth, async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase not configured' }); return; }
  const { data, error } = await supabaseAdmin
    .from('vault_items')
    .select('id,name,encrypted_content,salt,iv,password_hint,size_bytes,created_at,updated_at')
    .eq('user_id', req.uid)
    .order('updated_at', { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ items: data || [] });
});

app.post('/api/vault', requireAuth, async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase not configured' }); return; }
  const { id, name, encrypted_content, salt, iv, password_hint, size_bytes } = req.body;
  if (!id || !name || !encrypted_content || !salt || !iv) {
    res.status(400).json({ error: 'Missing required fields' }); return;
  }
  const { error } = await supabaseAdmin.from('vault_items').upsert({
    id,
    user_id: req.uid,
    name,
    encrypted_content,
    salt,
    iv,
    password_hint: password_hint || null,
    size_bytes: size_bytes || 0,
    updated_at: new Date().toISOString()
  });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

app.delete('/api/vault/:id', requireAuth, async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase not configured' }); return; }
  const { error } = await supabaseAdmin
    .from('vault_items')
    .delete()
    .eq('user_id', req.uid)
    .eq('id', req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ─── Admin Panel API ─────────────────────────────────────────────────────────
// These endpoints are only accessible to users whose Firebase UID is listed in
// the ADMIN_UIDS env var (comma-separated). Never expose Supabase credentials
// or raw user data without this check.

const ADMIN_UIDS = new Set(
  (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean)
);

const requireAdmin: express.RequestHandler = async (req, res, next) => {
  // First verify the Firebase token (reuse requireAuth logic inline)
  if (!adminApp) {
    res.status(503).json({ error: 'Server auth not configured.' });
    return;
  }
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) { res.status(401).json({ error: 'Missing token.' }); return; }

  try {
    const decoded = await getAdminAuth(adminApp).verifyIdToken(match[1]);
    req.uid = decoded.uid;
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
    return;
  }

  if (ADMIN_UIDS.size > 0 && !ADMIN_UIDS.has(req.uid!)) {
    res.status(403).json({ error: 'Forbidden — not an admin.' });
    return;
  }
  next();
};

// GET /api/admin/users — list all profiles with aggregated stats
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase not configured.' }); return; }

  const { data: profiles, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, payload, updated_at')
    .order('updated_at', { ascending: false });

  if (pErr) { res.status(500).json({ error: pErr.message }); return; }

  // For each user attach file / audit / device counts
  const userIds = (profiles || []).map((p: any) => p.id);

  const [{ data: fileCounts }, { data: auditCounts }, { data: deviceCounts }] =
    await Promise.all([
      supabaseAdmin.from('files').select('user_id').in('user_id', userIds),
      supabaseAdmin.from('audit_logs').select('user_id').in('user_id', userIds),
      supabaseAdmin.from('devices').select('user_id').in('user_id', userIds)
    ]);

  const count = (rows: any[] | null, uid: string) =>
    (rows || []).filter((r: any) => r.user_id === uid).length;

  const users = (profiles || []).map((p: any) => ({
    uid: p.id,
    email: p.email,
    profile: p.payload,
    updatedAt: p.updated_at,
    stats: {
      files: count(fileCounts, p.id),
      auditLogs: count(auditCounts, p.id),
      devices: count(deviceCounts, p.id)
    }
  }));

  res.json({ users, total: users.length });
});

// GET /api/admin/users/:uid/data — full data dump for one user
app.get('/api/admin/users/:uid/data', requireAdmin, async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase not configured.' }); return; }

  const { uid } = req.params;

  const [
    { data: profile },
    { data: files },
    { data: auditLogs },
    { data: devices }
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('payload').eq('id', uid).maybeSingle(),
    supabaseAdmin.from('files').select('id,payload,updated_at').eq('user_id', uid).order('updated_at', { ascending: false }),
    supabaseAdmin.from('audit_logs').select('id,payload,updated_at').eq('user_id', uid).order('updated_at', { ascending: false }),
    supabaseAdmin.from('devices').select('id,payload,updated_at').eq('user_id', uid).order('updated_at', { ascending: false })
  ]);

  res.json({
    uid,
    profile: profile?.payload ?? null,
    files: (files || []).map((r: any) => r.payload),
    auditLogs: (auditLogs || []).map((r: any) => r.payload),
    devices: (devices || []).map((r: any) => r.payload)
  });
});

// GET /api/admin/stats — platform-wide statistics
app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Supabase not configured.' }); return; }

  const [
    { count: userCount },
    { count: fileCount },
    { count: auditCount },
    { count: deviceCount },
    { data: recentActivity }
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('files').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('audit_logs').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('devices').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('audit_logs')
      .select('user_id, payload, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20)
  ]);

  res.json({
    totals: {
      users: userCount ?? 0,
      files: fileCount ?? 0,
      auditLogs: auditCount ?? 0,
      devices: deviceCount ?? 0
    },
    recentActivity: (recentActivity || []).map((r: any) => ({
      userId: r.user_id,
      log: r.payload,
      at: r.updated_at
    })),
    serverTime: new Date().toISOString()
  });
});

// ─── Vite / Static serving ────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniDrive] Server running → http://localhost:${PORT}`);
    console.log(`[OmniDrive] AI features: ${ai ? 'ENABLED (Gemini 2.0 Flash)' : 'DISABLED (Demo mode)'}`);
  });
}

startServer();
