import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink } from 'lucide-react';

export function ChatPanel({ session, onSend }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const messages = session?.messages || [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, session?.id]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [session?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);
    try {
      await onSend(q);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {!hasMessages ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: '32rem' }}>
            <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, textAlign: 'center', color: 'var(--text)', marginBottom: 20 }}>
              webmind
            </h1>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <form onSubmit={handleSend}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  question
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="ask anything..."
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    padding: '8px 12px',
                    background: 'transparent',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  disabled={loading}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      fontWeight: 600,
                      background: 'var(--accent)',
                      color: '#000',
                      padding: '8px 24px',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      opacity: loading || !input.trim() ? 0.3 : 1,
                    }}
                  >
                    send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingBottom: 16 }}>
            <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '32px 24px' }}>
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} style={{ marginBottom: 24 }}>
                    {m.role === 'user' ? (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)', padding: '8px 0' }}>
                        <span style={{ color: 'var(--accent)' }}>$ </span>{m.text}
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                          {m.text}
                        </div>
                        {m.sources?.length > 0 && <SourceRefs sources={m.sources} />}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                  <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>thinking</span>
                </motion.div>
              )}
            </div>
          </div>
          <div style={{ flexShrink: 0, padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '42rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="ask a follow-up..."
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    padding: '8px 12px',
                    background: 'transparent',
                    outline: 'none',
                  }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    fontWeight: 600,
                    background: 'var(--accent)',
                    color: '#000',
                    padding: '8px 24px',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    opacity: loading || !input.trim() ? 0.3 : 1,
                  }}
                >
                  send
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SourceRefs({ sources }) {
  const [open, setOpen] = useState(false);
  const shown = open ? sources : sources.slice(0, 3);
  return (
    <div style={{ marginTop: 8 }}>
      {shown.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>[{i + 1}]</span>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
          >
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {s.url.length > 50 ? s.url.slice(0, 50) + '...' : s.url}
            </span>
            <ExternalLink size={9} style={{ flexShrink: 0 }} />
          </a>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
            {(s.score * 100).toFixed(0)}%
          </span>
        </div>
      ))}
      {sources.length > 3 && (
        <button
          onClick={() => setOpen(!open)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {open ? 'less' : `+${sources.length - 3} more`}
        </button>
      )}
    </div>
  );
}
