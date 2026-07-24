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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const refresh = () => setSessions(getSessions());

  const handleNewChat = () => {
    const s = createSession();
    setActiveId(s.id);
    refresh();
    setTimeout(() => inputRef.current?.focus(), 50);
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
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="chat-panel">
      {/* Session sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button onClick={handleNewChat} className="chat-new-btn">+ new</button>
        </div>
        <div className="chat-sidebar-list">
          {sessions.length === 0 && (
            <p className="chat-empty-text">no chats</p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => { setActiveId(s.id); setTimeout(() => inputRef.current?.focus(), 50); }}
              className={`chat-session-item ${activeId === s.id ? 'active' : ''}`}
            >
              <span className="chat-session-title">{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                className="chat-delete-btn"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-main">
        {!hasMessages ? (
          <div className="chat-empty">
            <div className="chat-empty-box">
              <h1 className="chat-title">webmind</h1>
              <div className="chat-input-card">
                <form onSubmit={handleSend}>
                  <label className="chat-label">question</label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="ask anything..."
                    className="chat-input"
                    disabled={loading}
                  />
                  <div className="chat-send-row">
                    <button type="submit" disabled={loading || !input.trim()} className="chat-send-btn">
                      send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-messages-layout">
            <div ref={scrollRef} className="chat-scroll">
              <div className="chat-messages">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="chat-msg"
                    >
                      {m.role === 'user' ? (
                        <div className="chat-msg-user">
                          <span className="chat-prompt">$</span> {m.text}
                        </div>
                      ) : (
                        <div className="chat-msg-ai">
                          <div className="chat-msg-text">{m.text}</div>
                          {m.sources?.length > 0 && <SourceRefs sources={m.sources} />}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chat-loading">
                    <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    <span>thinking</span>
                  </motion.div>
                )}
              </div>
            </div>
            <div className="chat-input-bar">
              <div className="chat-input-card">
                <form onSubmit={handleSend} className="chat-input-form">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="ask a follow-up..."
                    className="chat-input"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading || !input.trim()} className="chat-send-btn">
                    send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .chat-panel { display: flex; height: 100%; }
        .chat-sidebar { width: 208px; flex-shrink: 0; border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .chat-sidebar-header { padding: 12px; border-bottom: 1px solid var(--border); }
        .chat-sidebar-list { flex: 1; overflow-y: auto; }
        .chat-empty-text { color: var(--text-muted); padding: 12px; font-size: 12px; font-family: var(--font-mono); }
        .chat-session-item { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; font-size: 12px; font-family: var(--font-mono); color: var(--text-secondary); border-left: 2px solid transparent; transition: all 0.1s; }
        .chat-session-item:hover { background: var(--bg-hover, rgba(255,255,255,0.03)); }
        .chat-session-item.active { color: var(--accent); border-left-color: var(--accent); }
        .chat-session-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chat-delete-btn { color: var(--text-muted); opacity: 0; background: none; border: none; cursor: pointer; padding: 0; transition: opacity 0.1s; }
        .chat-session-item:hover .chat-delete-btn { opacity: 1; }
        .chat-new-btn { width: 100%; text-align: left; background: var(--accent); color: #000; padding: 8px 12px; font-size: 13px; font-family: var(--font-mono); font-weight: 600; cursor: pointer; border: none; border-radius: 4px; }
        .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; }
        .chat-empty { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .chat-empty-box { width: 100%; max-width: 32rem; }
        .chat-title { font-family: var(--font-mono); font-size: 18px; font-weight: 600; text-align: center; color: var(--text); margin-bottom: 20px; }
        .chat-input-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
        .chat-label { display: block; font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
        .chat-input { width: 100%; font-family: var(--font-mono); font-size: 14px; color: var(--text); border: 1px solid var(--border); padding: 8px 12px; background: transparent; box-sizing: border-box; outline: none; }
        .chat-input:focus { border-color: var(--accent); }
        .chat-send-row { display: flex; justify-content: flex-end; margin-top: 12px; }
        .chat-send-btn { font-family: var(--font-mono); font-size: 14px; font-weight: 600; background: var(--accent); color: #000; padding: 8px 24px; border: none; border-radius: 4px; cursor: pointer; }
        .chat-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .chat-messages-layout { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .chat-scroll { flex: 1; overflow-y: auto; }
        .chat-messages { max-width: 42rem; margin: 0 auto; padding: 32px 24px; }
        .chat-msg { margin-bottom: 24px; }
        .chat-msg-user { font-family: var(--font-mono); font-size: 14px; color: var(--text); padding: 8px 0; }
        .chat-prompt { color: var(--accent); }
        .chat-msg-ai { }
        .chat-msg-text { font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: var(--text-secondary); }
        .chat-loading { display: flex; align-items: center; gap: 8px; padding: 8px 0; font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
        .chat-input-bar { flex-shrink: 0; padding: 0 24px 24px 24px; display: flex; justify-content: center; }
        .chat-input-form { display: flex; align-items: center; gap: 12px; }
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
