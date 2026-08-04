import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, Trash2, RefreshCw, Database, ArrowRight } from 'lucide-react';
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

  const hostname = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  };

  return (
    <div className="flex-1 flex flex-col items-center" style={{ padding: '40px 24px 32px', overflowY: 'auto' }}>
      <div className="w-full max-w-xl">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 className="text-gradient" style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>
              sources
            </h1>
            <p className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {sources.length} url{sources.length !== 1 ? 's' : ''} ingested
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="chip"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            refresh
          </button>
        </div>

        {loading && sources.length === 0 ? (
          <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : sources.length === 0 ? (
          <div className="card" style={{ marginTop: 24, padding: '40px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                margin: '0 auto 14px',
                borderRadius: 12,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="mono" style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              nothing here yet
            </p>
            <p className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              ingest a url to build your knowledge base
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
            <AnimatePresence>
              {sources.map(source => (
                <motion.div
                  key={source.url}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className="card card-hover group"
                  style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--accent)',
                    }}
                  >
                    {hostname(source.url).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 12.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hostname(source.url)}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {source.url}
                    </div>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-muted)', display: 'flex', padding: 5 }}
                    title="Open source"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => handleDelete(source.url)}
                    disabled={deleting === source.url}
                    className="show-on-hover"
                    style={{
                      color: 'var(--red)',
                      background: 'color-mix(in srgb, var(--red) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
                      borderRadius: 8,
                      padding: 6,
                      display: 'flex',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    title="Delete source"
                  >
                    {deleting === source.url ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                questions draw from all of these <ArrowRight size={11} />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
