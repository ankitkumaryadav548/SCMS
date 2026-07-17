import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Search, X, MapPin, User, Building, Network, Loader2,
  Command, ArrowRight, Clock, Hash, Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const CATEGORY_META = {
  Location:   { icon: MapPin,    color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20', label: 'Location' },
  Citizen:    { icon: User,      color: 'text-cyan-400',     bg: 'bg-cyan-500/10',     border: 'border-cyan-500/20',    label: 'Citizen' },
  Department: { icon: Building,  color: 'text-blue-400',     bg: 'bg-blue-500/10',     border: 'border-blue-500/20',    label: 'Department' },
  Employee:   { icon: Network,   color: 'text-violet-400',   bg: 'bg-violet-500/10',   border: 'border-violet-500/20',  label: 'Employee' },
};

// Highlight matching text in a string
const Highlight = ({ text, query }) => {
  if (!query || !text) return <span>{text}</span>;
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-brand-500/30 text-brand-200 rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════
// RESULT ITEM
// ═══════════════════════════════════════════════════════════
const ResultItem = ({ result, query, isActive, onClick }) => {
  const meta = CATEGORY_META[result.category] || CATEGORY_META.Department;
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 group border-l-2 ${
        isActive
          ? 'bg-brand-500/10 border-l-brand-500'
          : 'border-l-transparent hover:bg-darkbg-border/30 hover:border-l-darkbg-border'
      }`}
    >
      {/* Icon badge */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border}`}>
        <Icon className={`h-4 w-4 ${meta.color}`} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-white truncate">
          <Highlight text={result.label} query={query} />
        </p>
        <p className="text-[11px] text-darkbg-textMuted truncate mt-0.5">
          <Highlight text={result.subLabel} query={query} />
        </p>
      </div>

      {/* Right: category chip + arrow */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
          {meta.label}
        </span>
        <ArrowRight className={`h-3.5 w-3.5 transition-all ${isActive ? 'text-brand-400' : 'text-darkbg-textMuted/0 group-hover:text-darkbg-textMuted'}`} />
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// SMART SEARCH COMPONENT
// ═══════════════════════════════════════════════════════════
const SmartSearch = () => {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const containerRef = useRef(null);
  const timerRef  = useRef(null);

  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent,  setRecent]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('smartsearch_recent') || '[]'); }
    catch { return []; }
  });
  const [categories, setCategories] = useState({});

  // ── Open / close ──────────────────────────────────────────
  const openSearch = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setActiveIdx(-1);
  }, []);

  // ── Global keyboard shortcut Ctrl+K or Cmd+K ─────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        open ? closeSearch() : openSearch();
      }
      if (e.key === 'Escape' && open) closeSearch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, openSearch, closeSearch]);

  // ── Click outside to close ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeSearch();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeSearch]);

  // ── Debounced trie suggest call ───────────────────────────
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setCategories({});
      setActiveIdx(-1);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await API.get(`/search/suggest?q=${encodeURIComponent(query.trim())}&limit=12`);
        setResults(res.data.data || []);
        setCategories(res.data.categories || {});
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setActiveIdx(-1);
      }
    }, 200);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  // ── Keyboard navigation ───────────────────────────────────
  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIdx >= 0 ? results[activeIdx] : results[0];
      if (target) selectResult(target);
    }
  };

  // ── Select a result ───────────────────────────────────────
  const selectResult = (result) => {
    // Save to recent
    const updated = [result, ...recent.filter(r => !(r.id === result.id && r.category === result.category))].slice(0, 6);
    setRecent(updated);
    localStorage.setItem('smartsearch_recent', JSON.stringify(updated));

    navigate(result.route);
    closeSearch();
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem('smartsearch_recent');
  };

  // Group results by category for display
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const allResults = Object.values(grouped).flat();

  return (
    <>
      {/* ── Trigger button in Navbar ──────────────────────── */}
      <button
        onClick={openSearch}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-darkbg-pure border border-darkbg-border rounded-lg text-sm text-darkbg-textMuted hover:text-white hover:border-brand-500/40 transition-all group"
        aria-label="Open Smart Search"
      >
        <Search className="h-4 w-4 group-hover:text-brand-400 transition-colors" />
        <span className="min-w-[140px] text-left">Search anything…</span>
        <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-darkbg-border rounded text-darkbg-textMuted border border-darkbg-border/60 ml-2">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={openSearch}
        className="md:hidden p-2 text-darkbg-textMuted hover:text-white rounded-lg hover:bg-darkbg-border transition-colors"
        aria-label="Open Smart Search"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* ── Overlay Modal ─────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeSearch} />

          {/* Search box container */}
          <div
            ref={containerRef}
            className="relative w-full max-w-2xl bg-darkbg-card border border-darkbg-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-scale-in"
            style={{ animation: 'scaleIn 0.15s ease-out' }}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-darkbg-border">
              <div className="flex items-center gap-2 text-darkbg-textMuted shrink-0">
                {loading ? (
                  <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search citizens, departments, locations…"
                className="flex-1 bg-transparent text-white text-base placeholder:text-darkbg-textMuted/50 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                  className="p-1 rounded-lg text-darkbg-textMuted hover:text-white hover:bg-darkbg-border transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd
                onClick={closeSearch}
                className="hidden md:flex items-center px-2 py-1 text-[10px] font-mono bg-darkbg-border/60 rounded border border-darkbg-border text-darkbg-textMuted cursor-pointer hover:text-white transition-all"
              >
                Esc
              </kbd>
            </div>

            {/* Results / suggestions body */}
            <div className="max-h-[460px] overflow-y-auto">
              {/* Trie source badge if results present */}
              {results.length > 0 && query && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-darkbg-border/60">
                  <Zap className="h-3 w-3 text-brand-400" />
                  <span className="text-[10px] text-darkbg-textMuted">
                    <span className="text-brand-400 font-semibold">Trie O(L)</span> — instant autocomplete · {results.length} suggestion{results.length !== 1 ? 's' : ''}
                  </span>
                  {/* Category filter chips */}
                  <div className="ml-auto flex items-center gap-1.5">
                    {Object.entries(categories).map(([cat, count]) => {
                      const m = CATEGORY_META[cat];
                      if (!m) return null;
                      return (
                        <span key={cat} className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${m.bg} ${m.color} ${m.border}`}>
                          {cat} {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grouped results */}
              {query && results.length > 0 && (
                <div>
                  {Object.entries(grouped).map(([category, items]) => {
                    const meta = CATEGORY_META[category];
                    return (
                      <div key={category}>
                        {/* Category header */}
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-darkbg-pure/40">
                          {meta && <meta.icon className={`h-3 w-3 ${meta.color}`} />}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-darkbg-textMuted">{category}</span>
                          <span className="text-[9px] text-darkbg-textMuted/60 ml-auto">{items.length} result{items.length !== 1 ? 's' : ''}</span>
                        </div>
                        {/* Items */}
                        {items.map((result, i) => {
                          const globalIdx = allResults.findIndex(r => r.id === result.id && r.category === result.category);
                          return (
                            <ResultItem
                              key={`${result.category}-${result.id}`}
                              result={result}
                              query={query}
                              isActive={activeIdx === globalIdx}
                              onClick={() => selectResult(result)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {query && !loading && results.length === 0 && (
                <div className="py-12 text-center text-darkbg-textMuted">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No results for "<span className="text-white">{query}</span>"</p>
                  <p className="text-xs mt-1 opacity-60">Try searching by name, ID, ward, or department code</p>
                </div>
              )}

              {/* Empty state with recent searches */}
              {!query && (
                <div className="p-4 space-y-4">
                  {recent.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-darkbg-textMuted flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Recent Searches
                        </span>
                        <button onClick={clearRecent} className="text-[10px] text-darkbg-textMuted hover:text-red-400 transition-colors">Clear</button>
                      </div>
                      <div className="space-y-0.5">
                        {recent.map((r, i) => {
                          const m = CATEGORY_META[r.category];
                          const Icon = m?.icon || Search;
                          return (
                            <button
                              key={i}
                              onClick={() => selectResult(r)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-darkbg-border/30 transition-all group text-left"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m?.bg || 'bg-darkbg-pure'} border ${m?.border || 'border-darkbg-border'}`}>
                                <Icon className={`h-3.5 w-3.5 ${m?.color || 'text-darkbg-textMuted'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{r.label}</p>
                                <p className="text-[10px] text-darkbg-textMuted truncate">{r.subLabel}</p>
                              </div>
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${m?.bg} ${m?.color} ${m?.border} shrink-0`}>{r.category}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick tip cards */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-darkbg-textMuted mb-2 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-brand-400" /> Smart Search Tips
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: User,     color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',   hint: 'Search citizens',   ex: 'Arjun, CIT-0001' },
                        { icon: MapPin,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',hint: 'Find city / location', ex: 'Delhi, Mumbai' },
                        { icon: Building, color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',   hint: 'Browse departments', ex: 'PWD, Health' },
                        { icon: Hash,     color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20', hint: 'Find staff by ID',   ex: 'EMP-0001' },
                      ].map(({ icon: Icon, color, bg, border, hint, ex }) => (
                        <div key={hint} className={`flex items-start gap-2.5 p-3 rounded-xl border ${bg} ${border}`}>
                          <Icon className={`h-4 w-4 ${color} mt-0.5 shrink-0`} />
                          <div>
                            <p className={`text-[11px] font-semibold ${color}`}>{hint}</p>
                            <p className="text-[10px] text-darkbg-textMuted mt-0.5">Try: {ex}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-darkbg-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-darkbg-textMuted">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-darkbg-border rounded text-[9px] border border-darkbg-border/80">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-darkbg-border rounded text-[9px] border border-darkbg-border/80">↵</kbd> Select</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-darkbg-border rounded text-[9px] border border-darkbg-border/80">Esc</kbd> Close</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-darkbg-textMuted">
                <Zap className="h-3 w-3 text-brand-400" />
                <span>Powered by <span className="text-brand-400 font-semibold">Trie DSA</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline CSS for scale-in animation */}
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
};

export default SmartSearch;
