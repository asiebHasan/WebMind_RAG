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
      <header style={{ height: '48px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <span className="mono text-sm font-semibold" style={{ color: 'var(--text)' }}>
          webmind
        </span>
        <div className="flex items-center gap-3">
          {sourceCount > 0 && (
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {sourceCount} sources
            </span>
          )}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="mono text-xs px-2 py-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {theme === 'dark' ? 'light' : 'dark'}
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
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px' }}>
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
      </div>
    </div>
  );
}
