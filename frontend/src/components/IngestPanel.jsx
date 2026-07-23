import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Globe, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Ingest a website
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Crawl, chunk, and embed any URL into your knowledge base.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl focus-ring"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text)' }}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-5 py-3 text-sm font-medium rounded-xl transition-all disabled:opacity-30 hover:brightness-110 active:scale-[0.98] focus-ring"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Ingest'}
          </button>
        </form>

        {/* Options toggle */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-1.5 text-xs transition-colors hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          {showOptions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Options
        </button>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Depth
                  <input
                    type="number"
                    min={1} max={10}
                    value={maxDepth}
                    onChange={e => setMaxDepth(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-lg text-sm font-mono focus-ring"
                    style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Pages
                  <input
                    type="number"
                    min={1} max={500}
                    value={maxPages}
                    onChange={e => setMaxPages(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-lg text-sm font-mono focus-ring"
                    style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--red)' }}
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}
      </div>

      {/* Jobs */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Jobs
          </p>
          <div className="space-y-2">
            <AnimatePresence>
              {jobs.map(job => (
                <motion.div
                  key={job.job_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {job.status === 'running' && <Loader2 size={16} className="animate-spin shrink-0" style={{ color: 'var(--accent)' }} />}
                      {job.status === 'completed' && <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--green)' }} />}
                      {job.status === 'failed' && <XCircle size={16} className="shrink-0" style={{ color: 'var(--red)' }} />}
                      {job.status === 'pending' && <span className="w-4 h-4 rounded-full animate-pulse shrink-0" style={{ background: 'var(--yellow)' }} />}
                      <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{job.url}</span>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 rounded-md shrink-0 ml-3" style={{ background: 'var(--raised)', color: 'var(--text-muted)' }}>
                      {job.job_id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {job.status === 'completed' && `${job.pages_crawled} pages · ${job.chunks_stored} chunks`}
                    {job.status === 'running' && `Crawling... ${job.pages_crawled} pages`}
                    {job.status === 'failed' && (job.error || 'Failed')}
                    {job.status === 'pending' && 'Queued'}
                  </p>
                  {job.status === 'running' && (
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'var(--raised)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'var(--accent)' }}
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 12, ease: 'linear' }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state */}
      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Globe size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No jobs yet. Paste a URL above.
          </p>
        </div>
      )}
    </div>
  );
}
