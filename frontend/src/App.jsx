import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, Plus, Trash2, Globe, MessageSquare, Database, Sun, Moon } from 'lucide-react';
import { getSources } from './api';
import { getSessions, createSession, getSession, addMessage, deleteSession } from './chatStore';
import { IngestPanel } from './components/IngestPanel';
import { ChatPanel } from './components/ChatPanel';
import { SourcesPanel } from './components/SourcesPanel';

const tabs = [
  { id: 'ingest', label: 'Ingest', icon: Globe },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'sources', label: 'Sources', icon: Database },
];

export default function App() {
  const [view, setView] = useState('ingest');
  const [theme, setTheme] = useState(() => localStorage.getItem('wm-theme') || 'dark');
  const [sourceCount, setSourceCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [sessions, setSessions] = useState(() => getSessions());
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const s = getSessions();
    return s.length > 0 ? s[0].id : null;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wm-theme', theme);
  }, [theme]);

  const refreshSources = () => {
    getSources().then(d => setSourceCount(d.sources.length)).catch(() => {});
  };

  useEffect(() => { refreshSources(); }, []);

  const refreshSessions = () => setSessions(getSessions());

  const handleNewSession = () => {
    const s = createSession();
    setActiveSessionId(s.id);
    refreshSessions();
    setView('chat');
  };

  const handleDeleteSession = (id) => {
    deleteSession(id);
    const remaining = getSessions();
    setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    refreshSessions();
  };

  const handleSend = async (question) => {
    let sid = activeSessionId;
    if (!sid) {
      const s = createSession();
      sid = s.id;
      setActiveSessionId(sid);
      refreshSessions();
    }

    addMessage(sid, { role: 'user', text: question });
    refreshSessions();

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error('Query failed');
      const data = await res.json();
      addMessage(sid, { role: 'ai', text: data.answer, sources: data.sources });
    } catch (err) {
      addMessage(sid, { role: 'ai', text: `error: ${err.message}`, sources: [] });
    }
    refreshSessions();
  };

  const activeSession = activeSessionId ? getSession(activeSessionId) : null;

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Logo + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: collapsed ? '16px 12px' : '16px', borderBottom: '1px solid var(--border)', minHeight: 56 }}>
          {!collapsed && (
            <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              webmind
            </span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              marginLeft: collapsed ? 'auto' : 0,
              marginRight: collapsed ? 'auto' : 0,
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Chat sessions */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!collapsed && (
            <div style={{ padding: '8px 8px 0' }}>
              <button
                onClick={handleNewSession}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 0',
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                <Plus size={14} />
                new chat
              </button>
            </div>
          )}
          {collapsed && (
            <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleNewSession}
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="New chat"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {sessions.length === 0 && !collapsed && (
              <p style={{ color: 'var(--text-muted)', padding: '12px 12px', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                no chats yet
              </p>
            )}
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => { setActiveSessionId(s.id); setView('chat'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: collapsed ? '8px 0' : '8px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: activeSessionId === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                  background: activeSessionId === s.id ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                  borderLeft: activeSessionId === s.id && !collapsed ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                {collapsed ? (
                  <span title={s.title} style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-secondary)' }}>
                    {s.title.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                      style={{
                        color: 'var(--text-muted)',
                        opacity: 0,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        flexShrink: 0,
                      }}
                      className="show-on-hover"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: tabs + source count */}
        <div style={{ borderTop: '1px solid var(--border)', padding: collapsed ? '8px 0' : '8px' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  borderRadius: 6,
                  transition: 'background 0.1s',
                }}
              >
                <Icon size={16} />
                {!collapsed && tab.label}
              </button>
            );
          })}

          {!collapsed && (
            <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {sourceCount} source{sourceCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex', position: 'relative', width: 14, height: 14 }}
                title="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, scale: 0, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: 90, scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ position: 'absolute', display: 'flex' }}
                    >
                      <Sun size={14} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, scale: 0, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: -90, scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ position: 'absolute', display: 'flex' }}
                    >
                      <Moon size={14} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          )}
          {collapsed && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
              <button
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', position: 'relative', width: 16, height: 16 }}
                title="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, scale: 0, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: 90, scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ position: 'absolute', display: 'flex' }}
                    >
                      <Sun size={16} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, scale: 0, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: -90, scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ position: 'absolute', display: 'flex' }}
                    >
                      <Moon size={16} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {view === 'ingest' && <IngestPanel onIngested={refreshSources} />}
            {view === 'chat' && (
              <ChatPanel
                session={activeSession}
                onSend={handleSend}
              />
            )}
            {view === 'sources' && <SourcesPanel onChanged={refreshSources} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`.show-on-hover { opacity: 0 !important; } *:hover > .show-on-hover { opacity: 1 !important; }`}</style>
    </div>
  );
}
