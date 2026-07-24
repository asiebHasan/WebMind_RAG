import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { getSources, deleteSource } from '../api';

export function SourcesPanel({ onChanged }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSources();
      setSources(data.sources);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (url) => {
    setDeleting(url);
    try {
      await deleteSource(url);
      setSources(prev => prev.filter(s => s.url !== url));
      onChanged();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="mono text-lg font-semibold" style={{ color: 'var(--text)' }}>
            sources
          </h1>
          <button
            onClick={load}
            disabled={loading}
            className="text-xs px-2 py-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
          {sources.length} url{sources.length !== 1 ? 's' : ''} ingested
        </p>

        {loading && sources.length === 0 ? (
          <div className="py-12 text-center">
            <Loader2 size={16} className="animate-spin mx-auto" style={{ color: 'var(--accent)' }} />
          </div>
        ) : sources.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              no sources — ingest a url first
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {sources.map((source) => (
              <div
                key={source.url}
                className="group flex items-center gap-3 py-2 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--green)' }} />
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-xs truncate flex-1 hover:underline"
                  style={{ color: 'var(--text)' }}
                >
                  {source.url}
                </a>
                <ExternalLink size={10} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                <button
                  onClick={() => handleDelete(source.url)}
                  disabled={deleting === source.url}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  style={{ color: 'var(--red)' }}
                >
                  {deleting === source.url ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
