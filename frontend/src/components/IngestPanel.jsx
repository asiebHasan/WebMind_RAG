import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { startIngest } from '../api';
import { useJobPolling } from '../hooks/useJobPolling';

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
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-5">
        <h1 className="mono text-lg font-semibold text-center" style={{ color: 'var(--text)' }}>
          webmind
        </h1>

        <div className="rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="mono text-xs block" style={{ color: 'var(--text-muted)' }}>
              url
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://"
              className="w-full mono text-sm bg-transparent focus-ring px-3 py-2"
              style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="mono text-xs flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {showOptions ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                options
              </button>
              <div className="flex-1" />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="mono text-sm font-semibold px-6 py-2 transition-all disabled:opacity-30"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'ingest'}
              </button>
            </div>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <label className="mono text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      depth
                      <input
                        type="number" min={1} max={10}
                        value={maxDepth}
                        onChange={e => setMaxDepth(Number(e.target.value))}
                        className="w-14 px-2 py-1 text-xs mono focus-ring"
                        style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </label>
                    <label className="mono text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      pages
                      <input
                        type="number" min={1} max={500}
                        value={maxPages}
                        onChange={e => setMaxPages(Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs mono focus-ring"
                        style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {error && (
          <p className="mono text-xs text-center" style={{ color: 'var(--red)' }}>
            {error}
          </p>
        )}

        <div className="flex justify-center gap-2">
          {['https://docs.python.org/3', 'https://news.ycombinator.com', 'https://w3schools.com'].map(sample => (
            <button
              key={sample}
              onClick={() => setUrl(sample)}
              className="mono text-xs px-3 py-1.5 transition-colors hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              {new URL(sample).hostname}
            </button>
          ))}
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="w-full max-w-lg mt-8">
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>jobs</p>
          <div className="space-y-0">
            {jobs.map(job => (
              <div
                key={job.job_id}
                className="flex items-center gap-3 py-2 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="shrink-0">
                  {job.status === 'running' && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />}
                  {job.status === 'completed' && <CheckCircle2 size={12} style={{ color: 'var(--green)' }} />}
                  {job.status === 'failed' && <XCircle size={12} style={{ color: 'var(--red)' }} />}
                  {job.status === 'pending' && <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--text-muted)' }} />}
                </span>
                <span className="mono text-xs truncate flex-1" style={{ color: 'var(--text)' }}>
                  {job.url}
                </span>
                <span className="mono text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {job.status === 'completed' && `${job.pages_crawled}p ${job.chunks_stored}c`}
                  {job.status === 'running' && `${job.pages_crawled}p...`}
                  {job.status === 'failed' && (job.error || 'fail')}
                  {job.status === 'pending' && 'wait'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
