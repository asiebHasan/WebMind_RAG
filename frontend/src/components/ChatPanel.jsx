import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { askQuestion } from '../api';
import { getSessions, createSession, getSession, addMessage, deleteSession } from '../chatStore';

export function ChatPanel() {
  const [sessions, setSessions] = useState(() => getSessions());
  const [activeId, setActiveId] = useState(() => {
    const s = getSessions();
    return s.length > 0 ? s[0].id : null;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const activeSession = activeId ? getSession(activeId) : null;
  const messages = activeSession?.messages || [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const refresh = () => setSessions(getSessions());

  const handleNewChat = () => {
    const s = createSession();
    setActiveId(s.id);
    refresh();
    inputRef.current?.focus();
  };

  const handleDeleteSession = (id) => {
    deleteSession(id);
    const remaining = getSessions();
    setActiveId(remaining.length > 0 ? remaining[0].id : null);
    refresh();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    if (!activeId) {
      const s = createSession();
      setActiveId(s.id);
      refresh();
    }

    const sid = activeId || getSessions()[0].id;
    addMessage(sid, { role: 'user', text: q });
    setInput('');
    setLoading(true);
    refresh();

    try {
      const res = await askQuestion(q);
      addMessage(sid, { role: 'ai', text: res.answer, sources: res.sources });
    } catch (err) {
      addMessage(sid, { role: 'ai', text: `error: ${err.message}`, sources: [] });
    } finally {
      setLoading(false);
      refresh();
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Session sidebar */}
      <div style={{ width: '208px', flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={handleNewChat}
            style={{ width: '100%', textAlign: 'left', background: 'var(--accent)', color: '#000', padding: '8px 12px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer' }}
          >
            + new
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {sessions.length === 0 && (
            <p style={{ color: 'var(--text-muted)', padding: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              no chats
            </p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => { setActiveId(s.id); inputRef.current?.focus(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                padding: '8px 12px', fontSize: '12px', fontFamily: 'var(--font-mono)',
                color: activeId === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                borderLeft: activeId === s.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                style={{ color: 'var(--text-muted)', opacity: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                className="show-on-hover"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {!hasMessages ? (
          /* Centered empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
            <div style={{ width: '100%', maxWidth: '32rem' }}>
              <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, textAlign: 'center', color: 'var(--text)', marginBottom: '20px' }}>
                webmind
              </h1>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <form onSubmit={handleSend}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    question
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="ask anything..."
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px 12px', background: 'transparent', boxSizing: 'border-box' }}
                    disabled={loading}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, background: 'var(--accent)', color: '#000', padding: '8px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading || !input.trim() ? 0.3 : 1 }}
                    >
                      send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Messages view */
          <>
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '32px 24px' }}>
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      style={{ marginBottom: '24px' }}
                    >
                      {m.role === 'user' ? (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', padding: '8px 0' }}>
                          <span style={{ color: 'var(--accent)' }}>$ </span>
                          {m.text}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                            {m.text}
                          </div>
                          {m.sources?.length > 0 && <SourceRefs sources={m.sources} />}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                    <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>thinking</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input at bottom */}
            <div style={{ flexShrink: 0, padding: '0 24px 24px 24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '42rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="ask a follow-up..."
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px 12px', background: 'transparent' }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, background: 'var(--accent)', color: '#000', padding: '8px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading || !input.trim() ? 0.3 : 1 }}
                  >
                    send
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .show-on-hover { opacity: 0 !important; }
        div:hover > .show-on-hover { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

function SourceRefs({ sources }) {
  const [open, setOpen] = useState(false);
  const shown = open ? sources : sources.slice(0, 3);

  return (
    <div style={{ marginTop: '8px' }}>
      {shown.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>[{i + 1}]</span>
          <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{s.url.length > 50 ? s.url.slice(0, 50) + '...' : s.url}</span>
            <ExternalLink size={9} style={{ flexShrink: 0 }} />
          </a>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
            {(s.score * 100).toFixed(0)}%
          </span>
        </div>
      ))}
      {sources.length > 3 && (
        <button onClick={() => setOpen(!open)} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {open ? 'less' : `+${sources.length - 3} more`}
        </button>
      )}
    </div>
  );
}
