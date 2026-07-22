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
    <div className="max-w-3xl mx-auto w-full px-10 pb-8 space-y-10">
      {/* Hero */}
      <div className="space-y-4">
        <h2 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Ingest a website
        </h2>
        <p className="text-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Paste a URL. We'll crawl it, chunk it, and embed it.
        </p>
      </div>

      {/* Input card */}
      <div
        className="p-6 rounded-3xl space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1 relative">
            <Globe
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-12 pr-4 py-3.5 text-lg rounded-2xl focus-ring transition-colors"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-8 py-3.5 text-lg font-semibold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] focus-ring"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            }}
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : 'Ingest'}
          </button>
        </form>

        {/* Advanced options */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 text-lg transition-colors hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          {showOptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          Advanced options
        </button>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-8 pt-3">
                <label className="flex items-center gap-3 text-lg" style={{ color: 'var(--text-secondary)' }}>
                  <span>Max depth</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxDepth}
                    onChange={e => setMaxDepth(Number(e.target.value))}
                    className="w-28 px-5 py-3 rounded-2xl text-lg font-mono focus-ring"
                    style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </label>
                <label className="flex items-center gap-3 text-lg" style={{ color: 'var(--text-secondary)' }}>
                  <span>Max pages</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={maxPages}
                    onChange={e => setMaxPages(Number(e.target.value))}
                    className="w-32 px-5 py-3 rounded-2xl text-lg font-mono focus-ring"
                    style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-5 rounded-2xl text-lg"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}
          >
            <AlertCircle size={22} />
            {error}
          </motion.div>
        )}
      </div>

      {/* Jobs */}
      {jobs.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-lg font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Active jobs
          </h3>
          <div className="space-y-4">
            <AnimatePresence>
              {jobs.map(job => (
                <motion.div
                  key={job.job_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="p-5 rounded-3xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {job.status === 'running' && <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />}
                      {job.status === 'completed' && <CheckCircle2 size={22} style={{ color: 'var(--green)' }} />}
                      {job.status === 'failed' && <XCircle size={22} style={{ color: 'var(--red)' }} />}
                      {job.status === 'pending' && (
                        <span className="w-5 h-5 rounded-full animate-pulse" style={{ background: 'var(--yellow)' }} />
                      )}
                      <span className="text-xl font-medium truncate max-w-lg" style={{ color: 'var(--text)' }}>
                        {job.url}
                      </span>
                    </div>
                    <span
                      className="text-base font-mono px-4 py-2 rounded-xl"
                      style={{ background: 'var(--raised)', color: job.status === 'completed' ? 'var(--green)' : job.status === 'failed' ? 'var(--red)' : 'var(--text-muted)' }}
                    >
                      {job.job_id}
                    </span>
                  </div>

                  <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                    {job.status === 'completed' && `${job.pages_crawled} pages crawled · ${job.chunks_stored} chunks stored`}
                    {job.status === 'running' && `Crawling... ${job.pages_crawled} pages found`}
                    {job.status === 'failed' && (job.error || 'Job failed')}
                    {job.status === 'pending' && 'Queued...'}
                  </span>

                  {job.status === 'running' && (
                    <div className="mt-5 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--raised)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'var(--accent)' }}
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 15, ease: 'linear' }}
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16 rounded-3xl"
          style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
        >
          <Globe size={64} className="mx-auto mb-6" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p className="text-3xl font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            No jobs yet
          </p>
          <p className="text-xl" style={{ color: 'var(--text-muted)' }}>
            Paste a URL above and hit Ingest.
          </p>
        </motion.div>
      )}
    </div>
  );
}
