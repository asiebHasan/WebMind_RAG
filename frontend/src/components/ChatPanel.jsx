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
    <div className="flex-1 flex h-full">
      {/* Session sidebar */}
      <div className="w-52 shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleNewChat}
            className="mono text-xs font-semibold w-full px-3 py-2 transition-colors text-left"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            + new
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="mono text-xs p-3" style={{ color: 'var(--text-muted)' }}>
              no chats
            </p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => { setActiveId(s.id); inputRef.current?.focus(); }}
              className="group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
              style={{
                color: activeId === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                borderLeft: activeId === s.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <span className="mono text-xs truncate flex-1">{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area — centered content */}
      <div className="flex-1 flex flex-col min-w-0">
        {!hasMessages ? (
          /* Centered empty state */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-lg space-y-5">
              <h1 className="mono text-lg font-semibold text-center" style={{ color: 'var(--text)' }}>
                webmind
              </h1>
              <div className="rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <form onSubmit={handleSend} className="space-y-3">
                  <label className="mono text-xs block" style={{ color: 'var(--text-muted)' }}>
                    question
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="ask anything..."
                    className="w-full mono text-sm bg-transparent focus-ring px-3 py-2"
                    style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                    disabled={loading}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="mono text-sm font-semibold px-6 py-2 transition-all disabled:opacity-30"
                      style={{ background: 'var(--accent)', color: '#000' }}
                    >
                      send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Messages view — centered */
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {m.role === 'user' ? (
                        <div className="mono text-sm py-2" style={{ color: 'var(--text)' }}>
                          <span style={{ color: 'var(--accent)' }}>$ </span>
                          {m.text}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                            {m.text}
                          </div>
                          {m.sources?.length > 0 && <SourceRefs sources={m.sources} />}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 py-2">
                    <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>thinking</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input at bottom — centered */}
            <div className="px-6 pb-6 flex justify-center">
              <div className="w-full max-w-2xl rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="ask a follow-up..."
                    className="flex-1 mono text-sm bg-transparent focus-ring px-3 py-2"
                    style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="mono text-sm font-semibold px-6 py-2 transition-all disabled:opacity-30"
                    style={{ background: 'var(--accent)', color: '#000' }}
                  >
                    send
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SourceRefs({ sources }) {
  const [open, setOpen] = useState(false);
  const shown = open ? sources : sources.slice(0, 3);

  return (
    <div className="space-y-1">
      {shown.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-xs py-1">
          <span className="mono" style={{ color: 'var(--text-muted)' }}>[{i + 1}]</span>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate hover:underline" style={{ color: 'var(--accent)' }}>
            <span className="mono">{s.url.length > 50 ? s.url.slice(0, 50) + '...' : s.url}</span>
            <ExternalLink size={9} />
          </a>
          <span className="mono ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>
            {(s.score * 100).toFixed(0)}%
          </span>
        </div>
      ))}
      {sources.length > 3 && (
        <button onClick={() => setOpen(!open)} className="mono text-xs" style={{ color: 'var(--accent)' }}>
          {open ? 'less' : `+${sources.length - 3} more`}
        </button>
      )}
    </div>
  );
}
