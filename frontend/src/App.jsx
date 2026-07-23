import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSources } from './api';
import { IngestPanel } from './components/IngestPanel';
import { ChatPanel } from './components/ChatPanel';
import { SourcesPanel } from './components/SourcesPanel';

const tabs = [
  { id: 'ingest', label: 'Ingest' },
  { id: 'chat', label: 'Chat' },
  { id: 'sources', label: 'Sources' },
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
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
          webmind
        </span>
        <div className="flex items-center gap-3">
          {sourceCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-md" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
              {sourceCount} source{sourceCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--raised)]"
            style={{ color: 'var(--text-muted)' }}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {view === 'ingest' && <IngestPanel onIngested={refreshSources} />}
            {view === 'chat' && <ChatPanel />}
            {view === 'sources' && <SourcesPanel onChanged={refreshSources} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom tabs */}
      <div className="h-14 flex items-center justify-center shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <nav className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="relative px-6 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ color: view === tab.id ? 'var(--text)' : 'var(--text-muted)' }}
            >
              {view === tab.id && (
                <motion.div
                  layoutId="tab"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
