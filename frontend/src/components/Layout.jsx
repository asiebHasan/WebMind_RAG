import { Sun, Moon, Database, MessageSquare, Globe, Cpu } from 'lucide-react';

const tabs = [
  { id: 'ingest', label: 'Ingest', icon: Globe },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'sources', label: 'Sources', icon: Database },
];

export function Layout({ activeTab, onTabChange, theme, onThemeToggle, jobCount, sourceCount, children }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar — desktop */}
      <aside
        className="hidden md:flex w-[240px] flex-col"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="font-mono text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            WebMind
          </span>
          <button
            onClick={onThemeToggle}
            className="p-1.5 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors"
                style={{
                  background: isActive ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1.5">
              <Cpu size={12} />
              Jobs active
            </span>
            <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{jobCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1.5">
              <Database size={12} />
              Sources
            </span>
            <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{sourceCount}</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
        >
          <span className="font-mono text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>WebMind</span>
          <button
            onClick={onThemeToggle}
            className="p-1.5 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* View content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Mobile bottom tabs */}
        <nav className="md:hidden flex" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
