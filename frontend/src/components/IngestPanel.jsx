import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Globe, ArrowRight, Database } from 'lucide-react';
import { startIngest } from '../api';
import { useJobPolling } from '../hooks/useJobPolling';

const samples = [
  { url: 'https://docs.python.org/3', label: 'python docs' },
  { url: 'https://react.dev', label: 'react docs' },
  { url: 'https://www.gutenberg.org', label: 'project gutenberg' },
  { url: 'https://w3schools.com', label: 'w3schools' },
];

export function IngestPanel({ onIngested }) {
  const [url, setUrl] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxPages, setMaxPages] = useState(50);

  useJobPolling(jobs, (updated) => {
    setJobs(prev => prev.map(j => j.job_id === updated.job_id ? { ...j, ...updated } : j));
    if (updated.status === 'completed') onIngested();
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await startIngest(url.trim(), maxDepth, maxPages);
      setJobs(prev => [{ ...result, pages_crawled: 0, chunks_stored: 0 }, ...prev]);
      setUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center" style={{ padding: '40px 24px 32px', overflowY: 'auto' }}>
      <div className="w-full max-w-xl">
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--accent)',
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)', display: 'inline-block' }} />
            private rag knowledge base
          </div>
          <h1 className="text-gradient" style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>
            Ingest any website
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8, maxWidth: 420, margin: '8px auto 0' }}>
            Paste a URL and webmind will crawl, chunk, embed and index it — then ask it anything.
          </p>
        </div>

        {/* Ingest form */}
        <div className="card" style={{ padding: 18 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Globe size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="input"
                  style={{ paddingLeft: 38 }}
                  disabled={loading}
                  aria-label="Website URL"
                />
              </div>
              <button type="submit" className="btn-accent" disabled={loading || !url.trim()}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>ingest</span><ArrowRight size={14} /></>}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="chip"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {showOptions ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                options
              </button>
              <span style={{ flex: 1, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                depth {maxDepth} · pages {maxPages}
              </span>
            </div>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div style={{ display: 'flex', gap: 16, paddingTop: 12, marginTop: 4, borderTop: '1px solid var(--border)' }}>
                    <label className="mono" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                      depth
                      <input
                        type="number" min={1} max={10}
                        value={maxDepth}
                        onChange={e => setMaxDepth(Number(e.target.value))}
                        className="input"
                        style={{ width: 64, padding: '6px 8px', fontSize: 12 }}
                      />
                    </label>
                    <label className="mono" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                      pages
                      <input
                        type="number" min={1} max={500}
                        value={maxPages}
                        onChange={e => setMaxPages(Number(e.target.value))}
                        className="input"
                        style={{ width: 72, padding: '6px 8px', fontSize: 12 }}
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mono" style={{ color: 'var(--red)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
              {error}
            </motion.p>
          )}
        </div>

        {/* Samples */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          {samples.map(s => (
            <button key={s.url} className="chip" onClick={() => setUrl(s.url)} title={s.url}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Jobs */}
        {jobs.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <p className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              jobs
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence>
                {jobs.map(job => (
                  <motion.div
                    key={job.job_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className="card card-hover"
                    style={{ padding: '12px 14px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ flexShrink: 0, display: 'flex' }}>
                        {job.status === 'running' && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />}
                        {job.status === 'completed' && <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />}
                        {job.status === 'failed' && <XCircle size={14} style={{ color: 'var(--red)' }} />}
                        {job.status === 'pending' && <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--text-muted)' }} />}
                      </span>
                      <span className="mono" style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                        {job.url}
                      </span>
                      <span className="mono" style={{ fontSize: 11, flexShrink: 0, color: 'var(--text-muted)' }}>
                        {job.status === 'completed' && <><span style={{ color: 'var(--green)' }}>{job.pages_crawled}p</span> · {job.chunks_stored}c</>}
                        {job.status === 'running' && `${job.pages_crawled}p…`}
                        {job.status === 'failed' && (job.error || 'fail')}
                        {job.status === 'pending' && 'waiting'}
                      </span>
                    </div>
                    {job.status === 'running' && (
                      <div style={{ marginTop: 8, height: 3, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-2)' }}>
                        <motion.div
                          style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #22d3ee))' }}
                          initial={{ width: '8%' }}
                          animate={{ width: '82%' }}
                          transition={{ duration: 20, ease: 'linear' }}
                        />
                      </div>
                    )}
                    {job.status === 'completed' && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Database size={11} style={{ color: 'var(--text-muted)' }} />
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          stored in chromadb · queryable now
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
