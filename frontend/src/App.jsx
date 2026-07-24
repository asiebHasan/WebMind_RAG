import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSources } from './api';
import { IngestPanel } from './components/IngestPanel';
import { ChatPanel } from './components/ChatPanel';
import { SourcesPanel } from './components/SourcesPanel';

const tabs = [
  { id: 'ingest', label: 'ingest' },
  { id: 'chat', label: 'chat' },
  { id: 'sources', label: 'sources' },
];

export default function App() {
  const [view, setView] = useState('ingest');
  const [theme, setTheme] = useState(() => localStorage.getItem('wm-theme') || 'dark');
  const [sourceCount, setSourceCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wm-theme', theme);
  }, [theme]);

  const refreshSources = () => {
    getSources().then(d => setSourceCount(d.sources.length)).catch(() => {});
  };

  useEffect(() => { refreshSources(); }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ height: '48px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span className="mono text-sm font-semibold" style={{ color: 'var(--text)' }}>
          webmind
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{
              width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: theme === 'dark' ? 'var(--surface)' : 'var(--accent)',
              position: 'relative', transition: 'background 0.3s ease',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            <motion.div
              animate={{ x: theme === 'dark' ? 2 : 24 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: theme === 'dark' ? 'var(--accent)' : '#fff',
                position: 'absolute', top: '3px', left: '3px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.svg
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2"/><path d="M12 20v2"/>
                    <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
                    <path d="M2 12h2"/><path d="M20 12h2"/>
                    <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.div>
          </button>
        </div>
      </header>

      {/* Content — centered */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {view === 'ingest' && <IngestPanel onIngested={refreshSources} />}
            {view === 'chat' && <ChatPanel />}
            {view === 'sources' && <SourcesPanel onChanged={refreshSources} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom tabs */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', padding: '0 24px' }}>
        {sourceCount > 0 && (
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {sourceCount} sources
          </span>
        )}
        <nav className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="mono text-sm font-medium px-6 py-3 transition-colors rounded"
              style={{ color: view === tab.id ? 'var(--accent)' : 'var(--text-muted)', padding: '12px 24px' }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ width: '80px' }} />
      </div>
    </div>
  );
}
