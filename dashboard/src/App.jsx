import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

// ── Constants ────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "https://meenakshirn-gtm-signal-api.hf.space";

const IMPACT_CONFIG = {
  high:   { label: "HIGH",      color: "#FF4D4D", bg: "rgba(255,77,77,0.08)",  border: "#FF4D4D" },
  medium: { label: "MED",       color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "#F59E0B" },
  low:    { label: "LOW",       color: "#475569", bg: "rgba(71,85,105,0.06)",  border: "#2D3A4A" },
};

const TYPE_LABELS = {
  feature_launch:      "FEATURE",
  pricing_change:      "PRICING",
  partnership:         "PARTNER",
  community_sentiment: "SENTIMENT",
  other:               "SIGNAL",
};

const COMPETITORS = ["All", "Cursor", "GitHub Copilot", "Windsurf", "Codeium"];
const IMPACTS     = ["All", "high", "medium", "low"];

const COMPETITOR_COLORS = {
  "Cursor":        "#00D9FF",
  "GitHub Copilot":"#7C3AED",
  "Windsurf":      "#10B981",
  "Codeium":       "#F59E0B",
};

// ── Styles ───────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #070B14; }
  .grid-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(0,217,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,217,255,0.022) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #00D9FF; animation: blink 1.4s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  .stat-card {
    background: #0F1724; border: 1px solid #1E2D40; border-radius: 10px;
    padding: 18px 22px; flex: 1; min-width: 130px; transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: rgba(0,217,255,0.2); }
  .stat-card.cyan { background: rgba(0,217,255,0.04); border-color: rgba(0,217,255,0.15); }
  .stat-lbl { font-family:'JetBrains Mono',monospace; font-size:10px; color:#475569; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:6px; }
  .stat-val { font-family:'Space Grotesk',sans-serif; font-size:28px; font-weight:700; line-height:1; }
  .pill {
    font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:500;
    letter-spacing:0.08em; text-transform:uppercase; padding:5px 12px;
    border-radius:20px; border:1px solid #1E2D40; background:transparent;
    color:#64748B; cursor:pointer; transition:all 0.15s;
  }
  .pill:hover { border-color:rgba(0,217,255,0.4); color:#CBD5E1; }
  .pill.on { background:rgba(0,217,255,0.1); border-color:#00D9FF; color:#00D9FF; }
  .signal-card {
    background:#0F1724; border:1px solid #1E2D40; border-left-width:3px;
    border-radius:10px; padding:18px 20px 15px; transition:transform 0.15s;
  }
  .signal-card:hover { transform:translateY(-1px); }
  .type-badge {
    font-family:'JetBrains Mono',monospace; font-size:10px; padding:3px 7px;
    border-radius:4px; background:rgba(0,217,255,0.08); color:#00D9FF;
    border:1px solid rgba(0,217,255,0.2); margin-left:6px;
  }
  .tag {
    font-family:'JetBrains Mono',monospace; font-size:10px; color:#2D3A4A;
    padding:2px 7px; border-radius:4px; background:#0A1020; border:1px solid #1A2535;
  }
  .src { font-family:'JetBrains Mono',monospace; font-size:10px; color:#334155; text-decoration:none; transition:color 0.15s; }
  .src:hover { color:#00D9FF; }
  .refresh-btn {
    font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.1em;
    text-transform:uppercase; padding:7px 14px; background:transparent;
    border:1px solid #1E2D40; border-radius:6px; color:#475569; cursor:pointer; transition:all 0.15s;
  }
  .refresh-btn:hover { border-color:rgba(0,217,255,0.4); color:#94A3B8; }
  .refresh-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .divider { height:1px; background:#1E2D40; flex:1; }
  .mono { font-family:'JetBrains Mono',monospace; }
  .chart-tooltip {
    background:#0F1724; border:1px solid #1E2D40; border-radius:8px;
    padding:10px 14px; font-family:'JetBrains Mono',monospace; font-size:11px;
  }
`;

// ── Custom Tooltip for chart ──────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div style={{ color: "#94A3B8", marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.fill, marginBottom: 2 }}>
          {p.name.toUpperCase()}: {p.value}
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyState({ hasFilters, onReset }) {
  return (
    <div style={{ padding: "52px 0", textAlign: "center" }}>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 28, color: "#1E2D40", marginBottom: 16 }}>
        [ ]
      </div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#2D3A4A", marginBottom: 8 }}>
        {hasFilters ? "// no signals match current filters" : "// no signals yet — run the pipeline first"}
      </div>
      <div style={{ fontSize: 12, color: "#1E2D40", marginBottom: 20 }}>
        {hasFilters
          ? "Try removing a filter or selecting a different competitor."
          : "Click Refresh Now or wait for the 08:00 UTC automated run."}
      </div>
      {hasFilters && (
        <button
          onClick={onReset}
          style={{
            fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "7px 16px", background: "transparent",
            border: "1px solid #1E2D40", borderRadius: 6, color: "#475569", cursor: "pointer"
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [signals,      setSignals]      = useState([]);
  const [stats,        setStats]        = useState(null);
  const [competitor,   setCompetitor]   = useState("All");
  const [impact,       setImpact]       = useState("All");
  const [loading,      setLoading]      = useState(false);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [toast,        setToast]        = useState(null);

  // ── Load data ──────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [sigRes, statRes] = await Promise.all([
        fetch(`${API}/signals?limit=100`),
        fetch(`${API}/stats`)
      ]);
      const sigData  = await sigRes.json();
      const statData = await statRes.json();
      setSignals(sigData.signals || []);
      setStats(statData);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Show toast ─────────────────────────────────────────────────
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Refresh handler ────────────────────────────────────────────
  const handleRefresh = async () => {
    setLoading(true);
    showToast("Pipeline triggered — fresh signals arriving in ~2 min", "info");
    try {
      await fetch(`${API}/refresh`, { method: "POST" });
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const [sigRes, statRes] = await Promise.all([
            fetch(`${API}/signals?limit=100`),
            fetch(`${API}/stats`)
          ]);
          const sigData  = await sigRes.json();
          const statData = await statRes.json();
          setSignals(sigData.signals || []);
          setStats(statData);
          setLastUpdated(new Date());
        } catch (e) {}
        if (attempts >= 12) {
          clearInterval(poll);
          setLoading(false);
          showToast("Feed updated", "success");
        }
      }, 15000);
    } catch (e) {
      setLoading(false);
      showToast("Could not trigger pipeline", "error");
    }
  };

  // ── Filter signals ─────────────────────────────────────────────
  const filtered = signals.filter(s => {
    const matchC = competitor === "All" || s.competitor === competitor;
    const matchI = impact     === "All" || s.impact     === impact;
    return matchC && matchI;
  });

  const hasFilters = competitor !== "All" || impact !== "All";

  // ── Chart data ─────────────────────────────────────────────────
  const chartData = COMPETITORS.filter(c => c !== "All").map(c => {
    const cs = signals.filter(s => s.competitor === c);
    return {
      name: c === "GitHub Copilot" ? "Copilot" : c,
      high:   cs.filter(s => s.impact === "high").length,
      medium: cs.filter(s => s.impact === "medium").length,
      low:    cs.filter(s => s.impact === "low").length,
    };
  });

  const fmt = iso => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#070B14", fontFamily: "'Inter',sans-serif", color: "#E2E8F0" }}>
      <style>{GLOBAL_CSS}</style>
      <div className="grid-bg" />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 100,
          background: "#0F1724", border: `1px solid ${toast.type === "success" ? "#10B981" : toast.type === "error" ? "#FF4D4D" : "#1E2D40"}`,
          borderRadius: 8, padding: "10px 16px",
          fontFamily: "'JetBrains Mono'", fontSize: 11,
          color: toast.type === "success" ? "#10B981" : toast.type === "error" ? "#FF4D4D" : "#94A3B8",
          maxWidth: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" }}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div style={{
          padding: "40px 0 32px",
          borderBottom: "1px solid #1E2D40",
          marginBottom: 28
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ maxWidth: 560 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div className="live-dot" />
                <span className="mono" style={{ fontSize: 10, color: "#00D9FF", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  Live Intelligence
                </span>
              </div>
              <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 30, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 12 }}>
                AI Coding Tools<br />
                <span style={{ color: "#00D9FF" }}>Signal Feed</span>
              </h1>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, marginBottom: 14 }}>
                Automated competitive intelligence across changelogs, HackerNews, and Reddit — processed daily with AI and scored by business impact.
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {Object.entries(COMPETITOR_COLORS).map(([name, color]) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                    <span className="mono" style={{ fontSize: 10, color: "#334155" }}>
                      {name === "GitHub Copilot" ? "Copilot" : name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              {lastUpdated && (
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 10, color: "#334155" }}>
                    loaded {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "#1E4A3A", marginTop: 3 }}>
                    pipeline runs daily 08:00 UTC
                  </div>
                </div>
              )}
              <button
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? "⏳ ~2 min" : "↻ Refresh Now"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <div className="stat-card">
            <div className="stat-lbl">Total Signals</div>
            <div className="stat-val" style={{ color: "#F1F5F9" }}>
              {dataLoading ? "—" : signals.length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">High Priority</div>
            <div className="stat-val" style={{ color: "#FF4D4D" }}>
              {dataLoading ? "—" : signals.filter(s => s.impact === "high").length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">Medium Priority</div>
            <div className="stat-val" style={{ color: "#F59E0B" }}>
              {dataLoading ? "—" : signals.filter(s => s.impact === "medium").length}
            </div>
          </div>
          <div className="stat-card cyan">
            <div className="stat-lbl">Competitors</div>
            <div className="stat-val" style={{ color: "#00D9FF" }}>4</div>
          </div>
        </div>

        {/* ── Chart ────────────────────────────────────────────── */}
        {!dataLoading && signals.length > 0 && (
          <div style={{
            background: "#0F1724", border: "1px solid #1E2D40", borderRadius: 10,
            padding: "20px 20px 12px", marginBottom: 24
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span className="mono" style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Signal distribution by competitor
              </span>
              <div style={{ display: "flex", gap: 14 }}>
                {[["high", "#FF4D4D"], ["medium", "#F59E0B"], ["low", "#2D3A4A"]].map(([k, c]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                    <span className="mono" style={{ fontSize: 9, color: "#334155", textTransform: "uppercase" }}>{k}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="name" width={56}
                  tick={{ fontFamily: "'JetBrains Mono'", fontSize: 10, fill: "#475569" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,217,255,0.03)" }} />
                <Bar dataKey="high"   stackId="a" fill="#FF4D4D" radius={[0,0,0,0]} />
                <Bar dataKey="medium" stackId="a" fill="#F59E0B" radius={[0,0,0,0]} />
                <Bar dataKey="low"    stackId="a" fill="#1E2D40" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginRight: 4 }}>
              Competitor
            </span>
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", marginRight: 4 }}>
              Impact
            </span>
            {IMPACTS.map(i => (
              <button
                key={i}
                className={`pill ${impact === i ? "on" : ""}`}
                style={impact === i && i !== "All" ? {
                  background: IMPACT_CONFIG[i]?.bg,
                  borderColor: IMPACT_CONFIG[i]?.color,
                  color: IMPACT_CONFIG[i]?.color
                } : {}}
                onClick={() => setImpact(i)}
              >
                {i === "All" ? "All" : IMPACT_CONFIG[i]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Signal count ──────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em", whiteSpace: "nowrap" }}>
            {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
            {hasFilters ? " (filtered)" : ""}
          </span>
          <div className="divider" />
        </div>

        {/* ── Signal Cards / Empty State ────────────────────────── */}
        {dataLoading ? (
          <div style={{ padding: "52px 0", textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 12, color: "#1E2D40" }}>
              // loading signals...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onReset={() => { setCompetitor("All"); setImpact("All"); }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(signal => {
              const cfg = IMPACT_CONFIG[signal.impact] || IMPACT_CONFIG.low;
              return (
                <div
                  key={signal.id}
                  className="signal-card"
                  style={{ borderLeftColor: cfg.border }}
                >
                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: COMPETITOR_COLORS[signal.competitor] || "#475569",
                        marginRight: 8, flexShrink: 0
                      }} />
                      <span style={{ fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, color: "#CBD5E1" }}>
                        {signal.competitor}
                      </span>
                      <span className="type-badge">
                        {TYPE_LABELS[signal.signal_type] || "SIGNAL"}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "'JetBrains Mono'", fontSize: 10, padding: "3px 8px",
                      borderRadius: 4, fontWeight: 500,
                      background: cfg.bg, color: cfg.color,
                      border: `1px solid ${cfg.color}40`
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Summary */}
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#E2E8F0", lineHeight: 1.55, marginBottom: 8 }}>
                    {signal.summary}
                  </p>

                  {/* Implication */}
                  {signal.implication && (
                    <p style={{
                      fontSize: 12, color: "#64748B", lineHeight: 1.5, marginBottom: 14,
                      borderLeft: "2px solid #1E2D40", paddingLeft: 10
                    }}>
                      {signal.implication}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {signal.tags?.slice(0, 4).map(t => (
                        <span key={t} className="tag">#{t}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="mono" style={{ fontSize: 10, color: "#293547" }}>
                        {fmt(signal.created_at)}
                      </span>
                      {signal.raw_signals?.url && (
                        <a href={signal.raw_signals.url} target="_blank" rel="noreferrer" className="src">
                          ↗ source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────── */}
        <div style={{
          marginTop: 48, paddingTop: 20,
          borderTop: "1px solid #0F1724",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 8
        }}>
          <span className="mono" style={{ fontSize: 10, color: "#1E2D40" }}>
            GTM Signal Intelligence Platform
          </span>
          <span className="mono" style={{ fontSize: 10, color: "#1E2D40" }}>
            FastAPI · Supabase · Groq · React
          </span>
        </div>

      </div>
    </div>
  );
}
