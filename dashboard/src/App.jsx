import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = import.meta.env.VITE_API_URL || "https://meenakshirn-gtm-signal-api.hf.space";

const COMP_COLOR = {
  "Cursor":        "#22D3EE",
  "GitHub Copilot":"#A78BFA",
  "Windsurf":      "#34D399",
  "Codeium":       "#FBBF24",
};

const IMPACT = {
  high:   { label:"HIGH",   color:"#F43F5E", dim:"rgba(244,63,94,0.12)",   glow:"rgba(244,63,94,0.3)" },
  medium: { label:"MED",    color:"#F59E0B", dim:"rgba(245,158,11,0.12)",  glow:"rgba(245,158,11,0.3)" },
  low:    { label:"LOW",    color:"#6B7280", dim:"rgba(107,114,128,0.08)", glow:"rgba(107,114,128,0.15)" },
};

const TYPE_MAP = {
  feature_launch:"FEATURE", pricing_change:"PRICING",
  partnership:"PARTNER", community_sentiment:"SENTIMENT", other:"SIGNAL",
};

const COMPETITORS = ["All","Cursor","GitHub Copilot","Windsurf","Codeium"];
const IMPACTS     = ["All","high","medium","low"];

// ── Global CSS ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#06050F; font-family:'Inter',sans-serif; color:#F0EFFE; -webkit-font-smoothing:antialiased; overflow-x:hidden; }

/* ── Ambient background ── */
.bg-wrap { position:fixed; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
.orb {
  position:absolute; border-radius:50%; filter:blur(100px); opacity:0.18;
}
.orb-1 { width:600px; height:600px; background:radial-gradient(circle,#7C3AED,transparent 70%); top:-200px; right:-100px; }
.orb-2 { width:400px; height:400px; background:radial-gradient(circle,#0EA5E9,transparent 70%); bottom:0; left:-100px; }
.orb-3 { width:300px; height:300px; background:radial-gradient(circle,#F43F5E,transparent 70%); top:50%; right:30%; opacity:0.06; }
.grid-tex {
  position:absolute; inset:0;
  background-image:linear-gradient(rgba(139,92,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.04) 1px,transparent 1px);
  background-size:44px 44px;
}

/* ── Navbar ── */
.navbar {
  position:sticky; top:0; z-index:50;
  background:rgba(6,5,15,0.8); backdrop-filter:blur(20px);
  border-bottom:1px solid rgba(139,92,246,0.15);
  padding:0 28px; height:56px;
  display:flex; align-items:center; justify-content:space-between;
}
.nav-logo {
  display:flex; align-items:center; gap:10px;
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:15px; font-weight:700; color:#F0EFFE;
  letter-spacing:-0.01em;
}
.logo-icon {
  width:28px; height:28px; border-radius:7px;
  background:linear-gradient(135deg,#7C3AED,#06B6D4);
  display:flex; align-items:center; justify-content:center;
  font-size:14px; flex-shrink:0;
}
.nav-badge {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  padding:3px 8px; border-radius:20px; letter-spacing:0.08em;
  background:rgba(139,92,246,0.15); color:#A78BFA;
  border:1px solid rgba(139,92,246,0.3);
}
.nav-right { display:flex; align-items:center; gap:12px; }
.live-indicator { display:flex; align-items:center; gap:6px; }
.live-dot { width:6px; height:6px; border-radius:50%; background:#34D399; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.5)} 50%{box-shadow:0 0 0 5px rgba(52,211,153,0)} }
.live-text { font-family:'JetBrains Mono',monospace; font-size:10px; color:#34D399; letter-spacing:0.08em; }

/* ── Refresh button ── */
.btn-refresh {
  font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.06em;
  padding:8px 16px; border-radius:8px; cursor:pointer; transition:all 0.2s;
  background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.2));
  border:1px solid rgba(139,92,246,0.4); color:#C4B5FD;
}
.btn-refresh:hover { background:linear-gradient(135deg,rgba(124,58,237,0.35),rgba(6,182,212,0.35)); border-color:rgba(139,92,246,0.7); color:#EDE9FE; box-shadow:0 0 20px rgba(124,58,237,0.3); }
.btn-refresh:disabled { opacity:0.35; cursor:not-allowed; }

/* ── Page wrap ── */
.page {
  position:relative; z-index:1;
  max-width:1080px; margin:0 auto; padding:32px 24px 80px;
}

/* ── Hero ── */
.hero { margin-bottom:32px; }
.hero-eyebrow {
  display:inline-flex; align-items:center; gap:7px;
  font-family:'JetBrains Mono',monospace; font-size:11px;
  color:#7C3AED; letter-spacing:0.1em; text-transform:uppercase;
  margin-bottom:14px;
  background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.25);
  padding:5px 12px; border-radius:20px;
}
.hero h1 {
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:clamp(26px,4vw,38px); font-weight:800;
  letter-spacing:-0.03em; line-height:1.1;
  margin-bottom:12px;
}
.grad-text {
  background:linear-gradient(90deg,#A78BFA,#22D3EE);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.hero-sub {
  font-size:14px; color:#6B7280; max-width:480px; line-height:1.65;
}

/* ── Competitor strip ── */
.comp-strip {
  display:grid; grid-template-columns:repeat(4,1fr); gap:10px;
  margin-bottom:28px;
}
.comp-card {
  background:rgba(13,11,31,0.8); border:1px solid rgba(139,92,246,0.12);
  border-radius:12px; padding:14px 16px;
  transition:border-color 0.2s, box-shadow 0.2s;
}
.comp-card:hover { border-color:rgba(139,92,246,0.3); box-shadow:0 0 20px rgba(124,58,237,0.1); }
.comp-card-name {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  text-transform:uppercase; letter-spacing:0.12em;
  color:#4B5563; margin-bottom:6px;
}
.comp-card-count {
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:24px; font-weight:800; line-height:1; margin-bottom:8px;
}
.comp-bar { height:3px; border-radius:2px; background:rgba(255,255,255,0.05); overflow:hidden; }
.comp-bar-fill {
  height:100%; border-radius:2px;
  animation:barIn 0.9s ease-out forwards; transform-origin:left;
}
@keyframes barIn { from{width:0} }
@media(max-width:600px) { .comp-strip { grid-template-columns:1fr 1fr; } }

/* ── Two-col layout ── */
.two-col {
  display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start;
}
@media(max-width:860px) { .two-col { grid-template-columns:1fr; } .sidebar { position:static !important; } }

/* ── Sidebar ── */
.sidebar { position:sticky; top:72px; display:flex; flex-direction:column; gap:14px; }
.side-card {
  background:rgba(13,11,31,0.85); border:1px solid rgba(139,92,246,0.12);
  border-radius:14px; padding:18px 20px;
  backdrop-filter:blur(8px);
}
.side-label {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  color:#4B5563; text-transform:uppercase; letter-spacing:0.14em; margin-bottom:14px;
}
.big-num {
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:38px; font-weight:800; line-height:1; margin-bottom:3px;
}
.stat-line { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid rgba(139,92,246,0.07); }
.stat-line:last-child { border-bottom:none; }
.stat-line-lbl { font-size:12px; color:#6B7280; }
.stat-line-val { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:500; }

/* ── Filter row ── */
.filter-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px; }
.filter-eyebrow {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  color:#4B5563; text-transform:uppercase; letter-spacing:0.14em;
  margin-right:4px; white-space:nowrap;
}
.pill {
  font-family:'JetBrains Mono',monospace; font-size:10px;
  padding:5px 12px; border-radius:20px;
  border:1px solid rgba(139,92,246,0.15); background:transparent; color:#6B7280;
  cursor:pointer; transition:all 0.15s; white-space:nowrap;
}
.pill:hover { border-color:rgba(139,92,246,0.4); color:#C4B5FD; }
.pill.on { background:rgba(139,92,246,0.15); border-color:#7C3AED; color:#C4B5FD; }

/* ── Count row ── */
.count-row { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.count-lbl { font-family:'JetBrains Mono',monospace; font-size:10px; color:#374151; text-transform:uppercase; letter-spacing:0.1em; white-space:nowrap; }
.count-line { flex:1; height:1px; background:rgba(139,92,246,0.08); }

/* ── Signal card ── */
.signal-card {
  background:rgba(13,11,31,0.85); border:1px solid rgba(139,92,246,0.1);
  border-radius:14px; overflow:hidden; margin-bottom:8px;
  backdrop-filter:blur(8px);
  transition:border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}
.signal-card:hover {
  border-color:rgba(139,92,246,0.35);
  transform:translateY(-2px);
  box-shadow:0 8px 32px rgba(124,58,237,0.15);
}
.card-top-bar { height:2px; }
.card-inner { padding:16px 18px 14px; }
.card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; flex-wrap:wrap; gap:6px; }
.card-head-l { display:flex; align-items:center; gap:7px; }
.cdot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.cname { font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:600; color:#E5E0FF; }
.tbadge {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  padding:2px 7px; border-radius:4px; letter-spacing:0.06em;
  background:rgba(139,92,246,0.1); color:#A78BFA;
  border:1px solid rgba(139,92,246,0.2);
}
.ibadge {
  font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:500;
  padding:3px 8px; border-radius:5px; letter-spacing:0.06em;
}
.summary { font-size:13.5px; font-weight:500; color:#E5E0FF; line-height:1.6; margin-bottom:8px; }
.impl {
  font-size:12px; color:#6B7280; line-height:1.55;
  border-left:2px solid rgba(139,92,246,0.2); padding-left:10px; margin-bottom:13px;
}
.card-foot { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; }
.tags { display:flex; gap:5px; flex-wrap:wrap; }
.tag {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  color:#374151; padding:2px 7px; border-radius:4px;
  background:rgba(139,92,246,0.05); border:1px solid rgba(139,92,246,0.1);
}
.foot-r { display:flex; align-items:center; gap:10px; }
.ts { font-family:'JetBrains Mono',monospace; font-size:9px; color:#1F2937; }
.src-a { font-family:'JetBrains Mono',monospace; font-size:9px; color:#374151; text-decoration:none; transition:color 0.15s; }
.src-a:hover { color:#A78BFA; }

/* ── Source tag ── */
.stag {
  font-family:'JetBrains Mono',monospace; font-size:10px;
  padding:4px 10px; border-radius:6px; display:inline-block;
  color:#4B5563; background:rgba(139,92,246,0.06);
  border:1px solid rgba(139,92,246,0.12);
}

/* ── Empty state ── */
.empty { padding:56px 0; text-align:center; }
.empty-glyph { font-family:'JetBrains Mono',monospace; font-size:32px; color:#1F2937; margin-bottom:14px; }
.empty-t { font-family:'JetBrains Mono',monospace; font-size:11px; color:#374151; letter-spacing:0.08em; margin-bottom:8px; }
.empty-s { font-size:12px; color:#1F2937; margin-bottom:20px; }
.empty-btn {
  font-family:'JetBrains Mono',monospace; font-size:10px;
  padding:8px 18px; border-radius:8px; cursor:pointer;
  background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.25);
  color:#A78BFA; transition:all 0.15s; letter-spacing:0.06em;
}
.empty-btn:hover { border-color:rgba(124,58,237,0.5); background:rgba(124,58,237,0.2); }

/* ── Skeleton shimmer ── */
.skeleton {
  background:linear-gradient(90deg,rgba(13,11,31,0.8) 25%,rgba(30,20,60,0.6) 50%,rgba(13,11,31,0.8) 75%);
  background-size:200% 100%; animation:shimmer 1.6s infinite; border-radius:6px;
}
@keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }

/* ── Toast ── */
.toast {
  position:fixed; top:66px; right:20px; z-index:100;
  background:rgba(13,11,31,0.95); backdrop-filter:blur(16px);
  border-radius:10px; padding:12px 16px;
  font-family:'JetBrains Mono',monospace; font-size:11px;
  max-width:310px; animation:toastIn 0.2s ease-out;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
}
@keyframes toastIn { from{transform:translateX(12px);opacity:0} }

/* ── Recharts ── */
.recharts-tooltip-wrapper { outline:none !important; }
.ctip { background:rgba(13,11,31,0.95); border:1px solid rgba(139,92,246,0.2); border-radius:8px; padding:10px 14px; font-family:'JetBrains Mono',monospace; font-size:11px; }

/* ── Footer ── */
.footer { margin-top:52px; padding-top:18px; border-top:1px solid rgba(139,92,246,0.08); display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
.footer span { font-family:'JetBrains Mono',monospace; font-size:9px; color:#1F2937; }
`;

// ── Tooltip ───────────────────────────────────────────────────────────────────
function CTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ctip">
      <div style={{ color:"#6B7280", marginBottom:6, fontSize:10 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.fill === "#1F2937" ? "#374151" : p.fill, marginBottom:2 }}>
          {p.name.toUpperCase()}: {p.value}
        </div>
      ))}
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkelCard() {
  return (
    <div style={{ background:"rgba(13,11,31,0.8)", border:"1px solid rgba(139,92,246,0.08)", borderRadius:14, padding:18, marginBottom:8 }}>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <div className="skeleton" style={{ width:80, height:10 }} />
        <div className="skeleton" style={{ width:50, height:10 }} />
      </div>
      <div className="skeleton" style={{ height:14, width:"88%", marginBottom:8 }} />
      <div className="skeleton" style={{ height:14, width:"70%", marginBottom:14 }} />
      <div className="skeleton" style={{ height:10, width:"50%", marginBottom:8 }} />
      <div className="skeleton" style={{ height:10, width:"30%" }} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [signals,     setSignals]     = useState([]);
  const [competitor,  setCompetitor]  = useState("All");
  const [impact,      setImpact]      = useState("All");
  const [loading,     setLoading]     = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast,       setToast]       = useState(null);

  const loadData = async () => {
    try {
      const r = await fetch(`${API}/signals?limit=100`);
      const d = await r.json();
      setSignals(d.signals || []);
      setLastUpdated(new Date());
    } catch(e) { console.error(e); }
    finally { setDataLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = async () => {
    setLoading(true);
    showToast("Pipeline triggered — fresh signals in ~2 min", "#34D399");
    try {
      await fetch(`${API}/refresh`, { method:"POST" });
      let n = 0;
      const t = setInterval(async () => {
        n++;
        try {
          const r = await fetch(`${API}/signals?limit=100`);
          const d = await r.json();
          setSignals(d.signals || []);
          setLastUpdated(new Date());
        } catch {}
        if (n >= 12) { clearInterval(t); setLoading(false); showToast("Feed updated", "#A78BFA"); }
      }, 15000);
    } catch { setLoading(false); showToast("Could not reach pipeline", "#F43F5E"); }
  };

  const filtered = signals.filter(s =>
    (competitor === "All" || s.competitor === competitor) &&
    (impact     === "All" || s.impact     === impact)
  );
  const hasFilters = competitor !== "All" || impact !== "All";

  const chartData = COMPETITORS.filter(c => c !== "All").map(c => ({
    name:   c === "GitHub Copilot" ? "Copilot" : c,
    high:   signals.filter(s => s.competitor === c && s.impact === "high").length,
    medium: signals.filter(s => s.competitor === c && s.impact === "medium").length,
    low:    signals.filter(s => s.competitor === c && s.impact === "low").length,
    total:  signals.filter(s => s.competitor === c).length,
  }));
  const maxTotal = Math.max(...chartData.map(c => c.total), 1);
  const fmt = iso => new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  return (
    <div style={{ minHeight:"100vh" }}>
      <style>{CSS}</style>

      {/* Ambient bg */}
      <div className="bg-wrap">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-tex" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ color:toast.color, borderColor:toast.color+"33" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="nav-logo">
          <div className="logo-icon">⚡</div>
          GTM Signal
          <span className="nav-badge">INTELLIGENCE</span>
        </div>
        <div className="nav-right">
          <div className="live-indicator">
            <div className="live-dot" />
            <span className="live-text">LIVE</span>
          </div>
          {lastUpdated && (
            <span style={{ fontFamily:"'JetBrains Mono'", fontSize:10, color:"#374151" }}>
              {lastUpdated.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
            </span>
          )}
          <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
            {loading ? "⏳ ~2 min" : "↻ Refresh Now"}
          </button>
        </div>
      </nav>

      {/* ── Page ───────────────────────────────────────────── */}
      <div className="page">

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="hero">
          <div className="hero-eyebrow">
            <span>⚡</span> AI Coding Tools Intelligence
          </div>
          <h1>
            Know what your competitors<br />
            are shipping <span className="grad-text">before anyone else.</span>
          </h1>
          <p className="hero-sub">
            Automated signal monitoring across Cursor, Windsurf, GitHub Copilot,
            and Codeium — processed by AI, scored by impact, delivered daily.
          </p>
        </div>

        {/* ── Competitor Cards ──────────────────────────────── */}
        {!dataLoading && (
          <div className="comp-strip">
            {COMPETITORS.filter(c => c !== "All").map(c => {
              const count = signals.filter(s => s.competitor === c).length;
              const color = COMP_COLOR[c] || "#6B7280";
              const pct   = Math.round((count / Math.max(signals.length, 1)) * 100);
              return (
                <div key={c} className="comp-card">
                  <div className="comp-card-name">{c === "GitHub Copilot" ? "Copilot" : c}</div>
                  <div className="comp-card-count" style={{ color }}>{count}</div>
                  <div className="comp-bar">
                    <div className="comp-bar-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color}99,${color})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Two-col ───────────────────────────────────────── */}
        <div className="two-col">

          {/* LEFT — Feed */}
          <div>
            {/* Filters */}
            <div style={{ marginBottom:18 }}>
              <div className="filter-row">
                <span className="filter-eyebrow">Competitor</span>
                {COMPETITORS.map(c => (
                  <button key={c} className={`pill ${competitor === c ? "on" : ""}`} onClick={() => setCompetitor(c)}>
                    {c === "GitHub Copilot" ? "Copilot" : c}
                  </button>
                ))}
              </div>
              <div className="filter-row">
                <span className="filter-eyebrow">Impact</span>
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

            {/* Count */}
            <div className="count-row">
              <span className="count-lbl">
                {dataLoading ? "loading…" : `${filtered.length} signal${filtered.length !== 1 ? "s" : ""}${hasFilters ? " (filtered)" : ""}`}
              </span>
              <div className="count-line" />
            </div>

            {/* Cards */}
            {dataLoading ? (
              [1,2,3,4].map(i => <SkelCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-glyph">◇</div>
                <div className="empty-t">{hasFilters ? "// no signals match filters" : "// pipeline not run yet"}</div>
                <div className="empty-s">{hasFilters ? "Try adjusting or clearing your filters." : "Click Refresh Now or wait for 08:00 UTC."}</div>
                {hasFilters && <button className="empty-btn" onClick={() => { setCompetitor("All"); setImpact("All"); }}>Clear filters</button>}
              </div>
            ) : (
              filtered.map(signal => {
                const imp  = IMPACT[signal.impact] || IMPACT.low;
                const cClr = COMP_COLOR[signal.competitor] || "#6B7280";
                return (
                  <div key={signal.id} className="signal-card">
                    <div className="card-top-bar" style={{ background:`linear-gradient(90deg,${imp.color},${imp.color}66)` }} />
                    <div className="card-inner">
                      <div className="card-head">
                        <div className="card-head-l">
                          <div className="cdot" style={{ background:cClr, boxShadow:`0 0 6px ${cClr}80` }} />
                          <span className="cname">{signal.competitor}</span>
                          <span className="tbadge">{TYPE_MAP[signal.signal_type] || "SIGNAL"}</span>
                        </div>
                        <span className="ibadge" style={{ background:imp.dim, color:imp.color, border:`1px solid ${imp.glow}` }}>
                          {imp.label}
                        </span>
                      </div>
                      <p className="summary">{signal.summary}</p>
                      {signal.implication && <p className="impl">{signal.implication}</p>}
                      <div className="card-foot">
                        <div className="tags">
                          {signal.tags?.slice(0,4).map(t => <span key={t} className="tag">#{t}</span>)}
                        </div>
                        <div className="foot-r">
                          <span className="ts">{fmt(signal.created_at)}</span>
                          {signal.raw_signals?.url && (
                            <a href={signal.raw_signals.url} target="_blank" rel="noreferrer" className="src-a">↗ source</a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT — Sidebar */}
          <div className="sidebar">

            {/* Stats */}
            <div className="side-card">
              <div className="side-label">Signal Summary</div>
              <div className="big-num" style={{ background:"linear-gradient(90deg,#A78BFA,#22D3EE)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                {dataLoading ? "—" : signals.length}
              </div>
              <div style={{ fontSize:11, color:"#4B5563", marginBottom:16 }}>total signals tracked</div>
              <div className="stat-line">
                <span className="stat-line-lbl">High priority</span>
                <span className="stat-line-val" style={{ color:"#F43F5E" }}>{signals.filter(s => s.impact === "high").length}</span>
              </div>
              <div className="stat-line">
                <span className="stat-line-lbl">Medium priority</span>
                <span className="stat-line-val" style={{ color:"#F59E0B" }}>{signals.filter(s => s.impact === "medium").length}</span>
              </div>
              <div className="stat-line">
                <span className="stat-line-lbl">Low priority</span>
                <span className="stat-line-val" style={{ color:"#6B7280" }}>{signals.filter(s => s.impact === "low").length}</span>
              </div>
            </div>

            {/* Chart */}
            {!dataLoading && signals.length > 0 && (
              <div className="side-card">
                <div className="side-label">Distribution</div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={chartData} layout="vertical" margin={{ top:0, right:0, bottom:0, left:0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={52}
                      tick={{ fontFamily:"'JetBrains Mono'", fontSize:10, fill:"#4B5563" }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CTip />} cursor={{ fill:"rgba(139,92,246,0.04)" }} />
                    <Bar dataKey="high"   stackId="a" fill="#F43F5E" radius={[0,0,0,0]} />
                    <Bar dataKey="medium" stackId="a" fill="#F59E0B" radius={[0,0,0,0]} />
                    <Bar dataKey="low"    stackId="a" fill="#1F2937" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", gap:12, marginTop:10 }}>
                  {[["high","#F43F5E"],["medium","#F59E0B"],["low","#374151"]].map(([k,c]) => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:c }} />
                      <span style={{ fontFamily:"'JetBrains Mono'", fontSize:9, color:"#374151", textTransform:"uppercase" }}>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline */}
            <div className="side-card">
              <div className="side-label">Pipeline Status</div>
              <div className="stat-line">
                <span className="stat-line-lbl">Schedule</span>
                <span className="stat-line-val" style={{ color:"#34D399" }}>08:00 UTC</span>
              </div>
              <div className="stat-line">
                <span className="stat-line-lbl">Last run</span>
                <span className="stat-line-val" style={{ color:"#6B7280", fontSize:11 }}>
                  {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "—"}
                </span>
              </div>
              <div className="stat-line">
                <span className="stat-line-lbl">Automation</span>
                <span className="stat-line-val" style={{ color:"#34D399" }}>● Active</span>
              </div>
            </div>

            {/* Sources */}
            <div className="side-card">
              <div className="side-label">Data Sources</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {["Changelog","HackerNews","Reddit","Blog"].map(s => (
                  <span key={s} className="stag">{s}</span>
                ))}
              </div>
              <div style={{ fontSize:11, color:"#374151", lineHeight:1.55 }}>
                AI extraction via Groq LLM<br />Rule-based impact scoring
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>GTM Signal Intelligence Platform</span>
          <span>FastAPI · Supabase · Groq · React · Vercel</span>
        </div>
      </div>
    </div>
  );
}
