import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { askQuestion } from '../api';

export function ChatView() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const result = await askQuestion(q);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}`, sources: [] },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`max-w-2xl ${msg.role === 'user' ? 'ml-auto' : ''}`}
            >
              {msg.role === 'user' ? (
                <div
                  className="rounded px-4 py-2.5 text-sm"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="rounded px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <SourceList sources={msg.sources} />
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl"
          >
            <div
              className="rounded px-4 py-3 text-sm flex items-center gap-2"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-tertiary)',
              }}
            >
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </div>
          </motion.div>
        )}

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Ask anything about your ingested sources.</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>e.g. "What are the main topics covered?"</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 md:px-10" style={{ borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleAsk} className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2.5 rounded text-sm transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2.5 text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)' }}
          >
            <Send size={16} />
          </button>
        </form>
        {error && (
          <p className="max-w-2xl mx-auto mt-2 text-xs" style={{ color: 'var(--error)' }}>{error}</p>
        )}
      </div>
    </div>
  );
}

function SourceList({ sources }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? sources : sources.slice(0, 2);

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Sources</p>
      {shown.map((s, i) => (
        <SourceItem key={i} source={s} index={i} />
      ))}
      {sources.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Show less' : `+${sources.length - 2} more`}
        </button>
      )}
    </div>
  );
}

function SourceItem({ source, index }) {
  const [showChunk, setShowChunk] = useState(false);

  return (
    <div className="rounded px-3 py-2" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-tertiary)' }}>[{index + 1}]</span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono truncate flex items-center gap-1 transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            {source.url}
            <ExternalLink size={10} className="shrink-0" />
          </a>
        </div>
        <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          {source.score.toFixed(2)}
        </span>
      </div>
      <button
        onClick={() => setShowChunk(!showChunk)}
        className="mt-1 text-xs transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {showChunk ? 'Hide chunk' : 'Show chunk'}
      </button>
      {showChunk && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.15 }}
          className="mt-2 text-xs font-mono whitespace-pre-wrap leading-relaxed pt-2"
          style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)' }}
        >
          {source.chunk}
        </motion.p>
      )}
    </div>
  );
}
