import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, Send, Sparkles, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';

const suggestions = [
  'Summarize the main topics covered',
  'What are the key concepts explained?',
  'Give me a quick overview of the content',
];

export function ChatPanel({ session, onSend, sourceCount, onGoIngest }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const messages = session?.messages || [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, session?.id]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [session?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);
    try {
      await onSend(q);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSuggestion = (q) => {
    setInput(q);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {!hasMessages ? (
        <Welcome sourceCount={sourceCount} onGoIngest={onGoIngest} onSuggestion={handleSuggestion} />
      ) : (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
            <div style={{ maxWidth: '46rem', margin: '0 auto', padding: '36px 24px 8px' }}>
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }} style={{ marginBottom: 26 }}>
                    {m.role === 'user' ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div
                          style={{
                            maxWidth: '85%',
                            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)',
                            borderRadius: '14px 14px 4px 14px',
                            padding: '10px 16px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13.5,
                            color: 'var(--text)',
                            lineHeight: 1.55,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div
                          style={{
                            flexShrink: 0,
                            width: 24,
                            height: 24,
                            marginTop: 2,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #22d3ee))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 14px -4px color-mix(in srgb, var(--accent) 60%, transparent)',
                          }}
                        >
                          <Sparkles size={12} color="#06281c" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #22d3ee))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Loader2 size={12} className="animate-spin" color="#06281c" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--accent)' }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                      />
                    ))}
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                      thinking
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <InputBar input={input} setInput={setInput} loading={loading} onSend={handleSend} inputRef={inputRef} />
        </>
      )}
    </div>
  );
}

function Welcome({ sourceCount, onGoIngest, onSuggestion }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '36rem', textAlign: 'center' }}>
        <div
          style={{
            width: 52,
            height: 52,
            margin: '0 auto 18px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #22d3ee))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 40px -8px color-mix(in srgb, var(--accent) 55%, transparent)',
          }}
        >
          <Sparkles size={26} color="#06281c" />
        </div>
        <h1 className="text-gradient" style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10 }}>
          ask webmind anything
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 auto 8px', maxWidth: 420 }}>
          Answers come from your ingested sources — with citations back to the exact page.
        </p>

        {sourceCount === 0 ? (
          <div className="card" style={{ marginTop: 20, padding: 16 }}>
            <p className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
              no sources ingested yet — add a website first
            </p>
            <button className="btn-accent" onClick={onGoIngest} style={{ fontSize: 12, padding: '8px 18px' }}>
              go to ingest <ArrowUpRight size={13} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 22 }}>
            {suggestions.map(s => (
              <button key={s} className="chip" onClick={() => onSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InputBar({ input, setInput, loading, onSend, inputRef }) {
  return (
    <div style={{ flexShrink: 0, padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '46rem',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) onSend(e); }}
          placeholder="ask a follow-up…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--text)',
            padding: '8px 10px',
          }}
          disabled={loading}
          aria-label="Question"
        />
        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className="btn-accent"
          style={{ padding: '9px 14px', borderRadius: 8 }}
          title="Send"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function SourceRefs({ sources }) {
  const [open, setOpen] = useState(false);
  const shown = open ? sources : sources.slice(0, 3);
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p className="mono" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        sources
      </p>
      {shown.map((s, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '7px 12px',
            borderRadius: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            fontSize: 12,
          }}
        >
          <span className="mono" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{i + 1}]</span>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--accent)',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            <span className="mono" style={{ fontSize: 11.5 }}>
              {s.url.length > 60 ? s.url.slice(0, 60) + '…' : s.url}
            </span>
            <ExternalLink size={9} style={{ flexShrink: 0 }} />
          </a>
          <span
            className="mono"
            style={{
              color: 'var(--accent)',
              flexShrink: 0,
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            }}
          >
            {(s.score * 100).toFixed(0)}%
          </span>
        </div>
      ))}
      {sources.length > 3 && (
        <button
          onClick={() => setOpen(!open)}
          className="chip"
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 10px' }}
        >
          {open ? <><ChevronUp size={10} /> fewer</> : <><ChevronDown size={10} /> +{sources.length - 3} more</>}
        </button>
      )}
    </div>
  );
}
