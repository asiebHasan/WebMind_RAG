import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { getSources, deleteSource } from '../api';

export function SourcesView({ onSourcesChanged }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchSources = async () => {
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

  useEffect(() => {
    fetchSources();
  }, []);

  const handleDelete = async (url) => {
    setDeleting(url);
    try {
      await deleteSource(url);
      setSources((prev) => prev.filter((s) => s.url !== url));
      onSourcesChanged();
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Sources</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {sources.length} URL{sources.length !== 1 ? 's' : ''} ingested
          </p>
        </div>
        <button
          onClick={fetchSources}
          disabled={loading}
          className="p-2 rounded transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Refresh sources"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && sources.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No sources ingested yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Go to Ingest to add a website.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence>
            {sources.map((source) => (
              <motion.div
                key={source.url}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.15 }}
                className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded transition-colors"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--success)' }} />
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm truncate flex items-center gap-1.5 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {source.url}
                    <ExternalLink size={12} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(source.url)}
                  disabled={deleting === source.url}
                  className="p-1.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label={`Delete ${source.url}`}
                >
                  {deleting === source.url ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
