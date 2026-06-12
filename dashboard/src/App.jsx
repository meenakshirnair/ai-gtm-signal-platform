import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ── Config ───────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "https://meenakshirn-gtm-signal-api.hf.space";

const COMP_COLOR = {
  "Cursor":        "#0EA5E9",
  "GitHub Copilot":"#8B5CF6",
  "Windsurf":      "#10B981",
  "Codeium":       "#F59E0B",
};

const IMPACT = {
  high:   { label:"HIGH",   color:"#EF4444", dim:"rgba(239,68,68,0.1)",   ring:"rgba(239,68,68,0.25)" },
  medium: { label:"MED",    color:"#F59E0B", dim:"rgba(245,158,11,0.1)",  ring:"rgba(245,158,11,0.25)" },
  low:    { label:"LOW",    color:"#334155", dim:"rgba(51,65,85,0.06)",   ring:"rgba(51,65,85,0.2)" },
};

const TYPE_MAP = {
  feature_launch:"FEATURE", pricing_change:"PRICING",
  partnership:"PARTNER", community_sentiment:"SENTIMENT", other:"SIGNAL",
};

const COMPETITORS = ["All","Cursor","GitHub Copilot","Windsurf","Codeium"];
const IMPACTS     = ["All","high","medium","low"];

// ── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
html { scroll-behavior:smooth; }
body { background:#05080F; font-family:'Inter',sans-serif; color:#F1F5F9; -webkit-font-smoothing:antialiased; }

/* Grid texture */
.page-grid {
  position:fixed; inset:0; z-index:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(14,165,233,0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14,165,233,0.018) 1px, transparent 1px);
  background-size:48px 48px;
}

/* Navbar */
.navbar {
  position:sticky; top:0; z-index:50;
  background:rgba(5,8,15,0.85);
  backdrop-filter:blur(16px);
  border-bottom:1px solid #172438;
  padding:0 24px;
  height:52px;
  display:flex; align-items:center; justify-content:space-between;
}
.nav-brand {
  display:flex; align-items:center; gap:10px;
  font-family:'Outfit',sans-serif; font-size:15px; font-weight:600;
  color:#F1F5F9; letter-spacing:-0.01em;
}
.nav-right { display:flex; align-items:center; gap:12px; }

/* Live pulse */
.pulse-ring {
  width:8px; height:8px; border-radius:50%; background:#10B981;
  position:relative; flex-shrink:0;
}
.pulse-ring::after {
  content:''; position:absolute; inset:-3px;
  border-radius:50%; border:1px solid #10B981;
  animation:ping 2s ease-out infinite; opacity:0;
}
@keyframes ping { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2);opacity:0} }

/* Main layout */
.page-wrap {
  position:relative; z-index:1;
  max-width:1100px; margin:0 auto;
  padding:28px 24px 80px;
}
.two-col {
  display:grid;
  grid-template-columns:1fr 340px;
  gap:20px;
  align-items:start;
}
@media(max-width:860px) {
  .two-col { grid-template-columns:1fr; }
  .sidebar { position:static !important; }
}

/* Sidebar */
.sidebar {
  position:sticky; top:68px;
  display:flex; flex-direction:column; gap:14px;
}
.sidebar-card {
  background:#0C1525; border:1px solid #172438;
  border-radius:12px; padding:18px 20px;
}
.sidebar-label {
  font-family:'IBM Plex Mono',monospace; font-size:10px;
  color:#2D4A60; text-transform:uppercase; letter-spacing:0.14em;
  margin-bottom:14px;
}

/* Competitor pulse strip */
.pulse-strip {
  background:#0C1525; border:1px solid #172438;
  border-radius:12px; padding:16px 20px;
  display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px;
  margin-bottom:20px;
}
.pulse-item {
  display:flex; flex-direction:column; gap:5px;
}
.pulse-name {
  font-family:'IBM Plex Mono',monospace; font-size:9px;
  color:#2D4A60; text-transform:uppercase; letter-spacing:0.1em;
}
.pulse-count {
  font-family:'Outfit',sans-serif; font-size:22px; font-weight:700;
  line-height:1;
}
.pulse-bar {
  height:2px; border-radius:1px; background:#172438;
  position:relative; overflow:hidden;
}
.pulse-bar-fill {
  position:absolute; inset-y:0; left:0;
  border-radius:1px;
  animation:barload 0.8s ease-out forwards;
  transform-origin:left;
}
@keyframes barload { from{width:0} }

/* Stat items in sidebar */
.stat-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:8px 0;
  border-bottom:1px solid #0F1A2A;
}
.stat-row:last-child { border-bottom:none; padding-bottom:0; }
.stat-row-label {
  font-size:12px; color:#64748B;
}
.stat-row-val {
  font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:500;
}

/* Big stat */
.big-stat {
  font-family:'Outfit',sans-serif; font-size:36px; font-weight:700;
  line-height:1; margin-bottom:4px;
}

/* Filter row */
.filter-section { margin-bottom:18px; }
.filter-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px; }
.filter-label {
  font-family:'IBM Plex Mono',monospace; font-size:9px;
  color:#2D4A60; text-transform:uppercase; letter-spacing:0.14em;
  margin-right:4px; white-space:nowrap;
}
.pill {
  font-family:'IBM Plex Mono',monospace; font-size:10px; font-weight:500;
  letter-spacing:0.06em; text-transform:uppercase;
  padding:5px 12px; border-radius:20px;
  border:1px solid #172438; background:transparent; color:#64748B;
  cursor:pointer; transition:all 0.15s; white-space:nowrap;
}
.pill:hover { border-color:rgba(14,165,233,0.35); color:#CBD5E1; }
.pill.on { background:rgba(14,165,233,0.1); border-color:#0EA5E9; color:#0EA5E9; }

/* Count row */
.count-row {
  display:flex; align-items:center; gap:10px; margin-bottom:14px;
}
.count-label {
  font-family:'IBM Plex Mono',monospace; font-size:10px;
  color:#2D4A60; text-transform:uppercase; letter-spacing:0.14em;
  white-space:nowrap;
}
.count-line { flex:1; height:1px; background:#0F1A2A; }

/* Signal cards */
.signal-feed { display:flex; flex-direction:column; gap:8px; }
.signal-card {
  background:#0C1525; border:1px solid #172438;
  border-radius:12px; padding:0;
  overflow:hidden;
  transition:border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  cursor:default;
}
.signal-card:hover {
  border-color:#1E3048;
  transform:translateY(-1px);
  box-shadow:0 4px 24px rgba(0,0,0,0.3);
}
.card-accent-bar { height:2px; }
.card-body { padding:16px 18px 14px; }
.card-head {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:10px; flex-wrap:wrap; gap:6px;
}
.card-head-left { display:flex; align-items:center; gap:7px; }
.comp-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.comp-name {
  font-family:'Outfit',sans-serif; font-size:13px; font-weight:600;
  color:#CBD5E1;
}
.type-badge {
  font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:500;
  padding:2px 7px; border-radius:4px; letter-spacing:0.08em;
  background:rgba(14,165,233,0.08); color:#0EA5E9;
  border:1px solid rgba(14,165,233,0.18);
}
.impact-badge {
  font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:500;
  padding:3px 8px; border-radius:4px; letter-spacing:0.08em;
}
.card-summary {
  font-size:13.5px; font-weight:500; color:#E2E8F0;
  line-height:1.6; margin-bottom:8px;
}
.card-impl {
  font-size:12px; color:#475569; line-height:1.55;
  border-left:2px solid #172438; padding-left:10px;
  margin-bottom:13px;
}
.card-foot {
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:6px;
}
.tag-row { display:flex; gap:5px; flex-wrap:wrap; }
.tag {
  font-family:'IBM Plex Mono',monospace; font-size:9px;
  color:#1E3048; padding:2px 7px; border-radius:4px;
  background:#080E19; border:1px solid #111E2E;
}
.foot-right { display:flex; align-items:center; gap:10px; }
.ts {
  font-family:'IBM Plex Mono',monospace; font-size:9px; color:#1E3048;
}
.src-link {
  font-family:'IBM Plex Mono',monospace; font-size:9px;
  color:#1E3048; text-decoration:none;
  transition:color 0.15s; letter-spacing:0.04em;
}
.src-link:hover { color:#0EA5E9; }

/* Empty state */
.empty-state {
  padding:56px 0; text-align:center;
}
.empty-icon {
  font-family:'IBM Plex Mono',monospace; font-size:32px;
  color:#0F1A2A; margin-bottom:16px;
}
.empty-title {
  font-family:'IBM Plex Mono',monospace; font-size:11px;
  color:#1E3048; margin-bottom:8px; letter-spacing:0.08em;
}
.empty-sub { font-size:12px; color:#0F1A2A; margin-bottom:20px; }
.empty-btn {
  font-family:'IBM Plex Mono',monospace; font-size:10px;
  letter-spacing:0.1em; text-transform:uppercase;
  padding:8px 18px; background:transparent;
  border:1px solid #172438; border-radius:6px;
  color:#334155; cursor:pointer; transition:all 0.15s;
}
.empty-btn:hover { border-color:#0EA5E9; color:#0EA5E9; }

/* Refresh button */
.btn-refresh {
  font-family:'IBM Plex Mono',monospace; font-size:10px;
  letter-spacing:0.08em; text-transform:uppercase;
  padding:7px 14px; background:transparent;
  border:1px solid #172438; border-radius:7px;
  color:#475569; cursor:pointer; transition:all 0.15s;
}
.btn-refresh:hover { border-color:rgba(14,165,233,0.4); color:#94A3B8; background:rgba(14,165,233,0.04); }
.btn-refresh:disabled { opacity:0.35; cursor:not-allowed; }

/* Toast */
.toast {
  position:fixed; top:64px; right:20px; z-index:100;
  background:#0C1525; border:1px solid #172438;
  border-radius:10px; padding:12px 16px;
  font-family:'IBM Plex Mono',monospace; font-size:11px;
  max-width:300px;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
  animation:slideIn 0.2s ease-out;
}
@keyframes slideIn { from{transform:translateX(16px);opacity:0} to{transform:none;opacity:1} }

/* Recharts overrides */
.recharts-tooltip-wrapper { outline:none !important; }
.custom-tooltip {
  background:#0C1525; border:1px solid #172438;
  border-radius:8px; padding:10px 14px;
  font-family:'IBM Plex Mono',monospace; font-size:11px;
}

/* Loading skeleton */
.skeleton {
  background: linear-gradient(90deg, #0C1525 25%, #111E32 50%, #0C1525 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius:8px;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Source tags */
.source-tag {
  font-family:'IBM Plex Mono',monospace; font-size:10px;
  padding:4px 10px; border-radius:6px; color:#2D4A60;
  background:#080E19; border:1px solid #111E2E;
  display:inline-block;
}

/* Footer */
.page-footer {
  margin-top:48px; padding-top:20px;
  border-top:1px solid #0C1525;
  display:flex; justify-content:space-between; align-items:center;
  flex-wrap:wrap; gap:8px;
}
.footer-text {
  font-family:'IBM Plex Mono',monospace; font-size:10px; color:#0F1A2A;
}
`;

// ── Sub-components ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{ color:"#64748B", marginBottom:6, fontSize:10 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.fill, marginBottom:2 }}>
          {p.name.toUpperCase()}: {p.value}
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background:"#0C1525", border:"1px solid #172438", borderRadius:12, padding:"18px", marginBottom:8 }}>
      <div className="skeleton" style={{ height:12, width:"40%", marginBottom:12 }} />
      <div className="skeleton" style={{ height:14, width:"90%", marginBottom:8 }} />
      <div className="skeleton" style={{ height:14, width:"75%", marginBottom:14 }} />
      <div className="skeleton" style={{ height:10, width:"55%", marginBottom:8 }} />
      <div className="skeleton" style={{ height:10, width:"30%" }} />
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">[ ]</div>
      <div className="empty-title">
        {hasFilters ? "// no signals match filters" : "// no signals yet"}
      </div>
      <div className="empty-sub">
        {hasFilters
          ? "Try removing a filter or selecting a different competitor."
          : "Click Refresh Now or wait for the 08:00 UTC pipeline run."}
      </div>
      {hasFilters && (
        <button className="empty-btn" onClick={onReset}>Clear filters</button>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [signals,     setSignals]     = useState([]);
  const [competitor,  setCompetitor]  = useState("All");
  const [impact,      setImpact]      = useState("All");
  const [loading,     setLoading]     = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast,       setToast]       = useState(null);

  const fetchData = async () => {
    try {
      const res  = await fetch(`${API}/signals?limit=100`);
      const data = await res.json();
      setSignals(data.signals || []);
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setDataLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg, color = "#64748B") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = async () => {
    setLoading(true);
    showToast("Pipeline triggered — fresh signals in ~2 min", "#10B981");
    try {
      await fetch(`${API}/refresh`, { method: "POST" });
      let n = 0;
      const t = setInterval(async () => {
        n++;
        try {
          const r = await fetch(`${API}/signals?limit=100`);
          const d = await r.json();
          setSignals(d.signals || []);
          setLastUpdated(new Date());
        } catch {}
        if (n >= 12) { clearInterval(t); setLoading(false); showToast("Feed updated", "#0EA5E9"); }
      }, 15000);
    } catch { setLoading(false); showToast("Could not trigger pipeline", "#EF4444"); }
  };

  // Derived data
  const filtered = signals.filter(s =>
    (competitor === "All" || s.competitor === competitor) &&
    (impact     === "All" || s.impact     === impact)
  );
  const hasFilters = competitor !== "All" || impact !== "All";

  const byCompetitor = COMPETITORS.filter(c => c !== "All").map(c => ({
    name:   c === "GitHub Copilot" ? "Copilot" : c,
    high:   signals.filter(s => s.competitor === c && s.impact === "high").length,
    medium: signals.filter(s => s.competitor === c && s.impact === "medium").length,
    low:    signals.filter(s => s.competitor === c && s.impact === "low").length,
    total:  signals.filter(s => s.competitor === c).length,
  }));

  const maxTotal = Math.max(...byCompetitor.map(c => c.total), 1);

  const highCount   = signals.filter(s => s.impact === "high").length;
  const medCount    = signals.filter(s => s.impact === "medium").length;
  const lowCount    = signals.filter(s => s.impact === "low").length;

  const fmt = iso => new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  return (
    <div style={{ minHeight:"100vh", background:"#05080F" }}>
      <style>{CSS}</style>
      <div className="page-grid" />

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ color: toast.color, borderColor: toast.color + "40" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="pulse-ring" />
          GTM Signal
          <span style={{ color:"#2D4A60", fontWeight:400, fontSize:12, marginLeft:4 }}>
            / AI Coding Tools
          </span>
        </div>
        <div className="nav-right">
          {lastUpdated && (
            <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:"#1E3048" }}>
              {lastUpdated.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
            </span>
          )}
          <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
            {loading ? "⏳ ~2 min" : "↻ Refresh Now"}
          </button>
        </div>
      </nav>

      {/* ── Page ────────────────────────────────────────────────── */}
      <div className="page-wrap">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{
            fontFamily:"'Outfit',sans-serif", fontSize:26, fontWeight:700,
            color:"#F1F5F9", letterSpacing:"-0.02em", marginBottom:6
          }}>
            Competitive Intelligence,{" "}
            <span style={{ color:"#0EA5E9" }}>automated.</span>
          </h1>
          <p style={{ fontSize:13, color:"#475569", maxWidth:520, lineHeight:1.6 }}>
            Tracks Cursor, Windsurf, GitHub Copilot, and Codeium across changelogs,
            HackerNews, and Reddit — processed daily with AI and scored by business impact.
          </p>
        </div>

        {/* ── Competitor Pulse Strip ───────────────────────────── */}
        {!dataLoading && (
          <div className="pulse-strip">
            {COMPETITORS.filter(c => c !== "All").map(c => {
              const count = signals.filter(s => s.competitor === c).length;
              const color = COMP_COLOR[c] || "#334155";
              const pct   = Math.round((count / Math.max(signals.length, 1)) * 100);
              return (
                <div key={c} className="pulse-item">
                  <span className="pulse-name">{c === "GitHub Copilot" ? "Copilot" : c}</span>
                  <span className="pulse-count" style={{ color }}>{count}</span>
                  <div className="pulse-bar">
                    <div
                      className="pulse-bar-fill"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Two-column layout ────────────────────────────────── */}
        <div className="two-col">

          {/* ── LEFT: Feed ─────────────────────────────────────── */}
          <div>
            {/* Filters */}
            <div className="filter-section">
              <div className="filter-row">
                <span className="filter-label">Competitor</span>
                {COMPETITORS.map(c => (
                  <button
                    key={c}
                    className={`pill ${competitor === c ? "on" : ""}`}
                    onClick={() => setCompetitor(c)}
                  >
                    {c === "GitHub Copilot" ? "Copilot" : c}
                  </button>
                ))}
              </div>
              <div className="filter-row">
                <span className="filter-label">Impact</span>
                {IMPACTS.map(i => (
                  <button
                    key={i}
                    className={`pill ${impact === i ? "on" : ""}`}
                    style={impact === i && i !== "All" ? {
                      background: IMPACT[i]?.dim,
                      borderColor: IMPACT[i]?.color,
                      color:       IMPACT[i]?.color,
                    } : {}}
                    onClick={() => setImpact(i)}
                  >
                    {i === "All" ? "All" : IMPACT[i]?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count row */}
            <div className="count-row">
              <span className="count-label">
                {dataLoading ? "loading" : `${filtered.length} signal${filtered.length !== 1 ? "s" : ""}${hasFilters ? " (filtered)" : ""}`}
              </span>
              <div className="count-line" />
            </div>

            {/* Cards */}
            <div className="signal-feed">
              {dataLoading ? (
                [1,2,3,4].map(i => <SkeletonCard key={i} />)
              ) : filtered.length === 0 ? (
                <EmptyState
                  hasFilters={hasFilters}
                  onReset={() => { setCompetitor("All"); setImpact("All"); }}
                />
              ) : (
                filtered.map(signal => {
                  const imp  = IMPACT[signal.impact] || IMPACT.low;
                  const cClr = COMP_COLOR[signal.competitor] || "#334155";
                  return (
                    <div key={signal.id} className="signal-card">
                      <div className="card-accent-bar" style={{ background: imp.color }} />
                      <div className="card-body">
                        <div className="card-head">
                          <div className="card-head-left">
                            <div className="comp-dot" style={{ background: cClr }} />
                            <span className="comp-name">{signal.competitor}</span>
                            <span className="type-badge">
                              {TYPE_MAP[signal.signal_type] || "SIGNAL"}
                            </span>
                          </div>
                          <span
                            className="impact-badge"
                            style={{
                              background: imp.dim,
                              color:      imp.color,
                              border:     `1px solid ${imp.ring}`,
                            }}
                          >
                            {imp.label}
                          </span>
                        </div>

                        <p className="card-summary">{signal.summary}</p>

                        {signal.implication && (
                          <p className="card-impl">{signal.implication}</p>
                        )}

                        <div className="card-foot">
                          <div className="tag-row">
                            {signal.tags?.slice(0,4).map(t => (
                              <span key={t} className="tag">#{t}</span>
                            ))}
                          </div>
                          <div className="foot-right">
                            <span className="ts">{fmt(signal.created_at)}</span>
                            {signal.raw_signals?.url && (
                              <a
                                href={signal.raw_signals.url}
                                target="_blank" rel="noreferrer"
                                className="src-link"
                              >
                                ↗ source
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Sidebar ─────────────────────────────────── */}
          <div className="sidebar">

            {/* Stats */}
            <div className="sidebar-card">
              <div className="sidebar-label">Signal Summary</div>
              <div className="big-stat" style={{ color:"#F1F5F9" }}>
                {dataLoading ? "—" : signals.length}
              </div>
              <div style={{ fontSize:11, color:"#2D4A60", marginBottom:16 }}>
                total signals tracked
              </div>
              <div className="stat-row">
                <span className="stat-row-label">High priority</span>
                <span className="stat-row-val" style={{ color:"#EF4444" }}>
                  {dataLoading ? "—" : highCount}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-row-label">Medium priority</span>
                <span className="stat-row-val" style={{ color:"#F59E0B" }}>
                  {dataLoading ? "—" : medCount}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-row-label">Low priority</span>
                <span className="stat-row-val" style={{ color:"#334155" }}>
                  {dataLoading ? "—" : lowCount}
                </span>
              </div>
            </div>

            {/* Distribution chart */}
            {!dataLoading && signals.length > 0 && (
              <div className="sidebar-card">
                <div className="sidebar-label">By Competitor</div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart
                    data={byCompetitor} layout="vertical"
                    margin={{ top:0, right:0, bottom:0, left:0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category" dataKey="name" width={52}
                      tick={{ fontFamily:"'IBM Plex Mono'", fontSize:10, fill:"#334155" }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(14,165,233,0.03)" }} />
                    <Bar dataKey="high"   stackId="a" fill="#EF4444" radius={[0,0,0,0]} />
                    <Bar dataKey="medium" stackId="a" fill="#F59E0B" radius={[0,0,0,0]} />
                    <Bar dataKey="low"    stackId="a" fill="#172438" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display:"flex", gap:12, marginTop:10 }}>
                  {[["high","#EF4444"],["medium","#F59E0B"],["low","#172438"]].map(([k,c]) => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:c, border: c === "#172438" ? "1px solid #1E3048" : "none" }} />
                      <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:"#1E3048", textTransform:"uppercase" }}>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline info */}
            <div className="sidebar-card">
              <div className="sidebar-label">Pipeline</div>
              <div className="stat-row">
                <span className="stat-row-label">Schedule</span>
                <span className="stat-row-val" style={{ color:"#10B981", fontSize:11 }}>08:00 UTC</span>
              </div>
              <div className="stat-row">
                <span className="stat-row-label">Last updated</span>
                <span className="stat-row-val" style={{ fontSize:11, color:"#64748B" }}>
                  {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "—"}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-row-label">Automation</span>
                <span className="stat-row-val" style={{ color:"#10B981", fontSize:11 }}>GitHub Actions</span>
              </div>
            </div>

            {/* Sources */}
            <div className="sidebar-card">
              <div className="sidebar-label">Data Sources</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["Changelog","HackerNews","Reddit","Dev Blog"].map(s => (
                  <span key={s} className="source-tag">{s}</span>
                ))}
              </div>
              <div style={{ marginTop:12, fontSize:11, color:"#1E3048", lineHeight:1.5 }}>
                Processed by Groq LLM · Scored by impact rules
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="page-footer">
          <span className="footer-text">GTM Signal Intelligence Platform</span>
          <span className="footer-text">FastAPI · Supabase · Groq · React</span>
        </div>
      </div>
    </div>
  );
}
