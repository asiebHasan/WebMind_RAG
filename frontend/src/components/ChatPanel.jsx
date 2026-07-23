import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, ChevronDown, ChevronUp, Send, MessageSquare, Plus, Trash2, Clock } from 'lucide-react';
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
      addMessage(sid, { role: 'ai', text: `Error: ${err.message}`, sources: [] });
    } finally {
      setLoading(false);
      refresh();
      inputRef.current?.focus();
    }
  };

  const timeAgo = (iso) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 flex gap-5" style={{ height: 'calc(100vh - 112px)' }}>
      {/* Sessions sidebar */}
      <div className="w-56 shrink-0 flex flex-col rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} />
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
              No conversations
            </p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => { setActiveId(s.id); inputRef.current?.focus(); }}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
              style={{
                background: activeId === s.id ? 'var(--bg)' : 'transparent',
                border: activeId === s.id ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              <MessageSquare size={14} className="shrink-0" style={{ color: activeId === s.id ? 'var(--accent)' : 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: activeId === s.id ? 'var(--text)' : 'var(--text-secondary)' }}>
                  {s.title}
                </p>
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={9} />{timeAgo(s.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pb-4">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {m.role === 'user' ? (
                  <div className="flex justify-end">
                    <div
                      className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <MessageSquare size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="px-4 py-3 rounded-2xl rounded-tl-md text-sm leading-relaxed" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                        {m.text}
                      </div>
                      {m.sources?.length > 0 && <SourceRefs sources={m.sources} />}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <MessageSquare size={14} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Thinking...</span>
              </div>
            </motion.div>
          )}

          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <MessageSquare size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ask anything</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Query your ingested sources.</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-transparent focus-ring"
              style={{ color: 'var(--text)' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 hover:brightness-110 active:scale-95 focus-ring"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SourceRefs({ sources }) {
  const [open, setOpen] = useState(false);
  const shown = open ? sources : sources.slice(0, 3);

  return (
    <div className="space-y-1">
      <AnimatePresence>
        {shown.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, delay: i * 0.03 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'var(--raised)' }}
          >
            <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              {i + 1}
            </span>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate hover:underline" style={{ color: 'var(--accent)' }}>
              {s.url.length > 45 ? s.url.slice(0, 45) + '...' : s.url}
              <ExternalLink size={10} className="shrink-0" />
            </a>
            <span className="ml-auto font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
              {(s.score * 100).toFixed(0)}%
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      {sources.length > 3 && (
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {open ? 'Less' : `+${sources.length - 3} more`}
        </button>
      )}
    </div>
  );
}
