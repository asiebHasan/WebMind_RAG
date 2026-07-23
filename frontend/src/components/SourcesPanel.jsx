import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, Trash2, Database, RefreshCw } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Sources</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {sources.length} URL{sources.length !== 1 ? 's' : ''} ingested
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--raised)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* List */}
      {loading && sources.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16">
          <Database size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sources yet. Go to Ingest.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {sources.map((source, i) => (
              <motion.div
                key={source.url}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15, delay: i * 0.02 }}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-[var(--surface)]"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--green)' }} />
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-1.5 truncate text-sm hover:underline"
                  style={{ color: 'var(--text)' }}
                >
                  {source.url}
                  <ExternalLink size={12} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                </a>
                <button
                  onClick={() => handleDelete(source.url)}
                  disabled={deleting === source.url}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                  style={{ color: 'var(--red)' }}
                >
                  {deleting === source.url ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
