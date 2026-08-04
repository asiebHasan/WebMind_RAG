import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, Plus, Trash2, Globe, MessageSquare, Database, Sun, Moon, Sparkles, Library } from 'lucide-react';
import { getSources } from './api';
import { getSessions, createSession, getSession, addMessage, deleteSession } from './chatStore';
import { IngestPanel } from './components/IngestPanel';
import { ChatPanel } from './components/ChatPanel';
import { SourcesPanel } from './components/SourcesPanel';

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'ingest', label: 'Ingest', icon: Globe },
  { id: 'sources', label: 'Sources', icon: Database },
];

export default function App() {
  const [view, setView] = useState('chat');
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
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(1200px 600px at 80% -10%, var(--bg-glow), transparent 60%), radial-gradient(900px 500px at -10% 110%, var(--bg-glow), transparent 55%)',
        }}
      />

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        view={view}
        setView={setView}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => { setActiveSessionId(id); setView('chat'); }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        sourceCount={sourceCount}
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {view === 'ingest' && <IngestPanel onIngested={refreshSources} />}
            {view === 'chat' && (
              <ChatPanel
                session={activeSession}
                onSend={handleSend}
                sourceCount={sourceCount}
                onGoIngest={() => setView('ingest')}
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

function Sidebar({
  collapsed, setCollapsed, view, setView, sessions, activeSessionId,
  onSelectSession, onNewSession, onDeleteSession, sourceCount, theme, toggleTheme,
}) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 252 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: collapsed ? '16px 12px' : '16px 14px', borderBottom: '1px solid var(--border)', minHeight: 57, gap: 10 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <BrandMark />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              webmind
            </span>
          </div>
        )}
        {collapsed && <BrandMark />}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            marginLeft: collapsed ? 'auto' : 'auto',
            transition: 'color 0.2s ease',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* New chat */}
      <div style={{ padding: collapsed ? '12px 10px' : '14px 14px 6px' }}>
        <button
          onClick={onNewSession}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'center',
            gap: 8,
            padding: collapsed ? '10px 0' : '11px 0',
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            boxShadow: '0 8px 24px -8px color-mix(in srgb, var(--accent) 55%, transparent)',
            transition: 'background-color 0.2s ease',
          }}
          title="New chat"
        >
          <Plus size={15} />
          {!collapsed && 'new chat'}
        </button>
      </div>

      {/* Sessions */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: 8 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
          {sessions.length === 0 && !collapsed && (
            <div style={{ padding: '18px 14px', borderRadius: 10, border: '1px dashed var(--border)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                no chats yet<br />start one above
              </p>
            </div>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                cursor: 'pointer',
                padding: collapsed ? '9px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontSize: 12.5,
                fontFamily: 'var(--font-mono)',
                color: activeSessionId === s.id ? 'var(--text)' : 'var(--text-secondary)',
                background: activeSessionId === s.id ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                border: '1px solid ' + (activeSessionId === s.id ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'transparent'),
                borderRadius: 8,
                marginBottom: 2,
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
            >
              {collapsed ? (
                <span title={s.title} style={{ width: 22, height: 22, borderRadius: 6, background: 'color-mix(in srgb, var(--accent) 16%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {s.title.charAt(0).toUpperCase()}
                </span>
              ) : (
                <>
                  <MessageSquare size={12} style={{ flexShrink: 0, color: activeSessionId === s.id ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                    style={{
                      color: 'var(--text-muted)',
                      opacity: 0,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      flexShrink: 0,
                    }}
                    className="show-on-hover"
                    title="Delete chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: nav + footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: collapsed ? '10px 0' : '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  padding: collapsed ? '11px 0' : '11px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  borderRadius: 8,
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                <Icon size={16} />
                {!collapsed && tab.label}
              </button>
            );
          })}
        </div>

        {!collapsed && (
          <div style={{ padding: '10px 6px 0', marginTop: 4, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                <Library size={12} style={{ color: 'var(--accent)' }} />
                <span>
                  {sourceCount} source{sourceCount !== 1 ? 's' : ''}
                </span>
              </div>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} size={14} />
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0', marginTop: 4, borderTop: '1px solid var(--border)' }}>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} size={15} />
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function BrandMark() {
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #22d3ee))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px -4px color-mix(in srgb, var(--accent) 60%, transparent)',
        flexShrink: 0,
      }}
    >
      <Sparkles size={14} color="#06281c" />
    </div>
  );
}

function ThemeToggle({ theme, toggleTheme, size }) {
  return (
    <button
      onClick={toggleTheme}
      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', position: 'relative', width: size + 4, height: size + 4 }}
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
            <Sun size={size} />
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
            <Moon size={size} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
