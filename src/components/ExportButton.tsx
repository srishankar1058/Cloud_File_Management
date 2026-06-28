/**
 * ExportButton.tsx
 *
 * Drop-in "Download my data" button.
 * Fetches all workspace data through the secure server proxy and triggers a
 * JSON download in the browser — no Supabase keys in the client.
 *
 * Usage:
 *   import ExportButton from './components/ExportButton';
 *   <ExportButton userId={currentUser.uid} />
 */

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportUserData } from '../services/database';

interface Props {
  userId: string;
  className?: string;
}

export default function ExportButton({ userId, className = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      await exportUserData(userId);
    } catch (e: any) {
      setError(e.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Download className="w-4 h-4" />}
        {loading ? 'Exporting…' : 'Download my data'}
      </button>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
