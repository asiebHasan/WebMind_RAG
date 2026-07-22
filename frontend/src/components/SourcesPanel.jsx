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
    <div className="max-w-3xl mx-auto w-full px-10 pb-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <h2 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Sources</h2>
          <p className="text-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {sources.length} URL{sources.length !== 1 ? 's' : ''} in your knowledge base
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="w-14 h-14 flex items-center justify-center rounded-2xl transition-all hover:brightness-110 active:scale-95 focus-ring"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && sources.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : sources.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 rounded-3xl"
          style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
        >
          <Database size={64} className="mx-auto mb-6" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p className="text-3xl font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>No sources yet</p>
          <p className="text-xl" style={{ color: 'var(--text-muted)' }}>Go to Ingest to add a website.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {sources.map((source, i) => (
              <motion.div
                key={source.url}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="group flex items-center gap-5 p-5 rounded-3xl transition-colors hover:brightness-110"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,197,94,0.1)' }}
                >
                  <Database size={22} style={{ color: 'var(--green)' }} />
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-2 truncate text-xl hover:underline"
                  style={{ color: 'var(--text)' }}
                >
                  {source.url}
                  <ExternalLink size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                </a>
                <button
                  onClick={() => handleDelete(source.url)}
                  disabled={deleting === source.url}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-red-500/10"
                  style={{ color: 'var(--red)' }}
                >
                  {deleting === source.url ? <Loader2 size={22} className="animate-spin" /> : <Trash2 size={22} />}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
