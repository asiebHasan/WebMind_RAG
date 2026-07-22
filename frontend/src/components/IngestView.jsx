import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { startIngest } from '../api';
import { useJobPolling } from '../hooks/useJobPolling';

export function IngestView({ jobs, setJobs, onIngestComplete }) {
  const [url, setUrl] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxPages, setMaxPages] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useJobPolling(jobs, (updated) => {
    setJobs((prev) =>
      prev.map((j) => (j.job_id === updated.job_id ? { ...j, ...updated } : j))
    );
    if (updated.status === 'completed') onIngestComplete();
  });

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    try {
      const result = await startIngest(url.trim(), maxDepth, maxPages);
      setJobs((prev) => [
        { ...result, pages_crawled: 0, chunks_stored: 0 },
        ...prev,
      ]);
      setUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Loader2 size={14} style={{ color: 'var(--accent)' }} className="animate-spin" />;
      case 'completed':
        return <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />;
      case 'failed':
        return <XCircle size={14} style={{ color: 'var(--error)' }} />;
      default:
        return <div className="w-3.5 h-3.5 rounded-full" style={{ border: '2px solid var(--warning)' }} />;
    }
  };

  const statusLabel = (job) => {
    if (job.status === 'completed') return `${job.pages_crawled} pages · ${job.chunks_stored} chunks`;
    if (job.status === 'failed') return job.error || 'Failed';
    if (job.status === 'running') return `${job.pages_crawled} pages crawled...`;
    return 'Queued...';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Ingest a website</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Paste a URL. We'll crawl it, chunk it, and embed it. Then ask anything.
        </p>
      </div>

      {/* URL Input */}
      <form onSubmit={handleIngest} className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.python.org/3/library/asyncio.html"
              className="w-full pl-11 pr-4 py-3 rounded-lg font-mono text-sm transition-all focus:outline-none"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{ background: 'var(--accent)', boxShadow: '0 1px 3px rgba(59,130,246,0.3)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Ingest'}
          </button>
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        )}

        {/* Collapsible options */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Advanced options
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
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Depth
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded font-mono text-sm"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Max pages
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={maxPages}
                    onChange={(e) => setMaxPages(Number(e.target.value))}
                    className="w-20 px-2 py-1 rounded font-mono text-sm"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Job list */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Jobs</h2>
          <div className="space-y-1.5">
            <AnimatePresence>
              {jobs.map((job) => (
                <motion.div
                  key={job.job_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="p-3 rounded"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {statusIcon(job.status)}
                      <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{job.job_id}</span>
                    </div>
                    <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-tertiary)' }}>{job.url}</span>
                  </div>
                  <p className="text-xs pl-5" style={{ color: 'var(--text-secondary)' }}>{statusLabel(job)}</p>
                  {job.status === 'running' && (
                    <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'var(--accent)' }}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
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

      {jobs.length === 0 && (
        <div className="text-center py-20">
          <Globe size={40} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>No jobs yet.</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paste a URL above to get started.</p>
        </div>
      )}
    </div>
  );
}
