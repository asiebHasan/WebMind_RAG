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

  const refresh = () => {
    setSessions(getSessions());
  };

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

    // Create session if none
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
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-6 flex gap-6" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Session sidebar */}
      <div
        className="w-72 shrink-0 flex flex-col rounded-3xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-base font-medium transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={18} />
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {sessions.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No conversations yet
            </p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => { setActiveId(s.id); inputRef.current?.focus(); }}
              className="group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all"
              style={{
                background: activeId === s.id ? 'var(--bg)' : 'transparent',
                border: activeId === s.id ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              <MessageSquare size={16} style={{ color: activeId === s.id ? 'var(--accent)' : 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-base truncate" style={{ color: activeId === s.id ? 'var(--text)' : 'var(--text-secondary)' }}>
                  {s.title}
                </p>
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={10} />
                  {timeAgo(s.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-6">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {m.role === 'user' ? (
                  <div className="flex justify-end">
                    <div
                      className="max-w-[80%] px-6 py-4 rounded-3xl rounded-br-md text-xl leading-relaxed"
                      style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.25)' }}
                    >
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-1"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <MessageSquare size={20} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div
                        className="px-6 py-5 rounded-3xl rounded-tl-md text-lg leading-relaxed"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
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
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <MessageSquare size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div
                className="px-6 py-5 rounded-3xl rounded-tl-md flex items-center gap-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
                <span className="text-base" style={{ color: 'var(--text-muted)' }}>Thinking...</span>
              </div>
            </motion.div>
          )}

          {messages.length === 0 && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <MessageSquare size={36} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Ask anything</p>
              <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Query your ingested sources.</p>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="p-5 rounded-3xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSend} className="flex gap-4 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-xl rounded-2xl bg-transparent focus-ring"
              style={{ color: 'var(--text)', padding: '20px 24px 20px 32px' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center rounded-2xl transition-all disabled:opacity-30 hover:brightness-110 active:scale-95 focus-ring"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.3)', width: '72px', height: '72px' }}
            >
              <Send size={26} />
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
    <div className="space-y-2">
      <AnimatePresence>
        {shown.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl text-base"
            style={{ background: 'var(--raised)' }}
          >
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
            >
              {i + 1}
            </span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 truncate hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              {s.url.length > 50 ? s.url.slice(0, 50) + '...' : s.url}
              <ExternalLink size={14} className="shrink-0" />
            </a>
            <span className="ml-auto text-sm font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
              {(s.score * 100).toFixed(0)}%
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      {sources.length > 3 && (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-base px-5 py-2 rounded-2xl transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {open ? 'Show less' : `+${sources.length - 3} more`}
        </button>
      )}
    </div>
  );
}
