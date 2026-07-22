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
      <header
        className="px-10 py-4 flex items-center justify-end shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-5">
          <span className="text-base px-4 py-2 rounded-full font-medium" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
            {sourceCount} source{sourceCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors hover:opacity-80 focus-ring"
            style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Content — centered */}
      <main className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col"
          >
            {view === 'ingest' && <IngestPanel onIngested={refreshSources} />}
            {view === 'chat' && <ChatPanel />}
            {view === 'sources' && <SourcesPanel onChanged={refreshSources} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom tab bar */}
      <div
        className="shrink-0 px-10 py-4 flex items-center justify-center"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <nav className="flex gap-3 p-2 rounded-2xl" style={{ background: 'var(--surface)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="relative text-lg font-semibold rounded-xl transition-all focus-ring"
              style={{
                color: view === tab.id ? 'var(--text)' : 'var(--text-muted)',
                background: view === tab.id ? 'var(--bg)' : 'transparent',
                border: view === tab.id ? '2px solid var(--border)' : '2px solid transparent',
                padding: '10px 24px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
