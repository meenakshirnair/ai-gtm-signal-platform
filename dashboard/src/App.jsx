import { useState, useEffect } from "react";

const IMPACT_CONFIG = {
  high:   { label: "HIGH",   color: "#FF4D4D", bg: "rgba(255,77,77,0.08)",   border: "#FF4D4D", dot: "#FF4D4D" },
  medium: { label: "MED",    color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "#F59E0B", dot: "#F59E0B" },
  low:    { label: "LOW",    color: "#475569", bg: "rgba(71,85,105,0.06)",   border: "#2D3A4A", dot: "#475569" },
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

export default function App() {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "https://meenakshirn-gtm-signal-api.hf.space";
    fetch(`${API}/signals?limit=50`)
      .then(r => r.json())
      .then(d => { setSignals(d.signals || []); setLastUpdated(new Date()); })
      .catch(console.error);
  }, []);
  const [competitor,       setCompetitor]       = useState("All");
  const [impact,           setImpact]           = useState("All");
  const [loading,          setLoading]          = useState(false);
  const [lastUpdated,      setLastUpdated]      = useState(new Date());
  const [pulse,            setPulse]            = useState(true);

  // Pulse animation for LIVE badge
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = signals.filter(s => {
    const matchC = competitor === "All" || s.competitor === competitor;
    const matchI = impact     === "All" || s.impact     === impact;
    return matchC && matchI;
  });

  const stats = {
    total:  signals.length,
    high:   signals.filter(s => s.impact === "high").length,
    medium: signals.filter(s => s.impact === "medium").length,
  };

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ minHeight: "100vh", background: "#070B14", fontFamily: "'Inter', sans-serif", color: "#E2E8F0" }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #070B14; }

        .grid-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(0,217,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,217,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .glow-cyan { box-shadow: 0 0 20px rgba(0,217,255,0.12); }

        .stat-card {
          background: #0F1724; border: 1px solid #1E2D40; border-radius: 10px;
          padding: 20px 24px; flex: 1; min-width: 140px;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: #00D9FF40; }

        .stat-label {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: #475569; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px;
        }
        .stat-value {
          font-family: 'Space Grotesk', sans-serif; font-size: 32px;
          font-weight: 700; line-height: 1;
        }

        .filter-pill {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 6px 14px; border-radius: 20px; border: 1px solid #1E2D40;
          background: transparent; color: #64748B; cursor: pointer;
          transition: all 0.15s;
        }
        .filter-pill:hover { border-color: #00D9FF60; color: #CBD5E1; }
        .filter-pill.active { background: rgba(0,217,255,0.1); border-color: #00D9FF; color: #00D9FF; }

        .signal-card {
          background: #0F1724; border: 1px solid #1E2D40;
          border-radius: 10px; padding: 20px 22px 18px;
          border-left-width: 3px;
          transition: transform 0.15s, border-color 0.15s;
          position: relative; overflow: hidden;
        }
        .signal-card:hover { transform: translateY(-1px); }
        .signal-card::before {
          content: ''; position: absolute; top: 0; right: 0;
          width: 120px; height: 120px;
          background: radial-gradient(circle, rgba(0,217,255,0.03) 0%, transparent 70%);
          pointer-events: none;
        }

        .signal-type-badge {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          font-weight: 500; letter-spacing: 0.1em;
          padding: 3px 8px; border-radius: 4px;
          background: rgba(0,217,255,0.08); color: #00D9FF;
          border: 1px solid rgba(0,217,255,0.2);
        }

        .impact-badge {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          font-weight: 500; letter-spacing: 0.1em;
          padding: 3px 8px; border-radius: 4px;
        }

        .tag {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: #334155; padding: 2px 8px; border-radius: 4px;
          background: #0A1020; border: 1px solid #1A2535;
        }

        .view-source {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: #334155; text-decoration: none; letter-spacing: 0.05em;
          transition: color 0.15s;
        }
        .view-source:hover { color: #00D9FF; }

        .live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #00D9FF;
          transition: opacity 0.5s;
        }

        .section-label {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: #334155; text-transform: uppercase; letter-spacing: 0.15em;
        }

        .divider { height: 1px; background: #1E2D40; }

        .competitor-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
      `}</style>

      <div className="grid-bg" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" }}>

        {/* Header */}
        <div style={{ padding: "32px 0 28px", borderBottom: "1px solid #1E2D40", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div className="live-dot" style={{ opacity: pulse ? 1 : 0.3 }} />
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#00D9FF", letterSpacing: "0.15em", textTransform: "uppercase" }}>Live Intelligence</span>
              </div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                AI Coding Tools<br />
                <span style={{ color: "#00D9FF" }}>Signal Feed</span>
              </h1>
              <p style={{ marginTop: 10, fontSize: 13, color: "#475569", fontFamily: "'Inter', sans-serif" }}>
                Tracking Cursor · Windsurf · GitHub Copilot · Codeium
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#334155" }}>
                  screen loaded {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#1E4A3A", marginTop: 3 }}>
                  pipeline runs daily 08:00 UTC
                </div>
              </div>
	      <button
                onClick={async () => {
  		  setLoading(true);
  		  try {
    		    const API = import.meta.env.VITE_API_URL || "https://meenakshirn-gtm-signal-api.hf.space";
    		    await fetch(`${API}/refresh`, { method: "POST" });
		    let attempts = 0;
    		    const poll = setInterval(async () => {
      			attempts++;
      			try {
        		  const r = await fetch(`${API}/signals?limit=50`);
        		  const d = await r.json();
        		  setSignals(d.signals || []);
        		  setLastUpdated(new Date());
      			} catch(e) {}
      			if (attempts >= 12) {
        		  clearInterval(poll);
        		  setLoading(false);
      			}
    		    }, 15000);
  		  } catch(e) {
    		    setLoading(false);
  		  }
		}}
		style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", padding: "7px 14px", background: "transparent", border: "1px solid #1E2D40", borderRadius: 6, color: "#475569", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.target.style.borderColor = "#00D9FF60"; e.target.style.color = "#94A3B8"; }}
                onMouseLeave={e => { e.target.style.borderColor = "#1E2D40"; e.target.style.color = "#475569"; }}
              >
		{loading ? "⏳ ~2 min" : "↻ Refresh Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <div className="stat-card">
            <div className="stat-label">Signals Today</div>
            <div className="stat-value" style={{ color: "#F1F5F9" }}>{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High Priority</div>
            <div className="stat-value" style={{ color: "#FF4D4D" }}>{stats.high}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Medium Priority</div>
            <div className="stat-value" style={{ color: "#F59E0B" }}>{stats.medium}</div>
          </div>
          <div className="stat-card" style={{ background: "rgba(0,217,255,0.04)", borderColor: "rgba(0,217,255,0.15)" }}>
            <div className="stat-label">Sources Active</div>
            <div className="stat-value" style={{ color: "#00D9FF" }}>4</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            <span className="section-label" style={{ marginRight: 4 }}>Competitor</span>
            {COMPETITORS.map(c => (
              <button key={c} className={`filter-pill ${competitor === c ? "active" : ""}`} onClick={() => setCompetitor(c)}>
                {c === "All" ? "All" : c === "GitHub Copilot" ? "Copilot" : c}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span className="section-label" style={{ marginRight: 4 }}>Impact</span>
            {IMPACTS.map(i => (
              <button key={i} className={`filter-pill ${impact === i ? "active" : ""}`}
                style={impact === i && i !== "All" ? { background: IMPACT_CONFIG[i]?.bg, borderColor: IMPACT_CONFIG[i]?.color, color: IMPACT_CONFIG[i]?.color } : {}}
                onClick={() => setImpact(i)}>
                {i === "All" ? "All" : IMPACT_CONFIG[i]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Signal Count */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span className="section-label">{filtered.length} signal{filtered.length !== 1 ? "s" : ""}</span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        {/* Signal Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#2D3A4A" }}>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, marginBottom: 8 }}>// no signals match filter</div>
              <div style={{ fontSize: 12, color: "#1E2D40" }}>Adjust your filters to see more results</div>
            </div>
          ) : filtered.map(signal => {
            const cfg = IMPACT_CONFIG[signal.impact] || IMPACT_CONFIG.low;
            return (
              <div key={signal.id} className="signal-card" style={{ borderLeftColor: cfg.border }}>
                {/* Card Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, color: "#CBD5E1" }}>
                      {signal.competitor}
                    </span>
                    <span className="signal-type-badge">{TYPE_LABELS[signal.signal_type] || "SIGNAL"}</span>
                  </div>
                  <span className="impact-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Summary */}
                <p style={{ fontSize: 14, fontWeight: 500, color: "#E2E8F0", lineHeight: 1.55, marginBottom: 8, fontFamily: "'Inter'" }}>
                  {signal.summary}
                </p>

                {/* Implication */}
                <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, marginBottom: 14, fontFamily: "'Inter'", borderLeft: "2px solid #1E2D40", paddingLeft: 10 }}>
                  {signal.implication}
                </p>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {signal.tags?.map(t => <span key={t} className="tag">#{t}</span>)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#293547" }}>
                      {fmt(signal.created_at)}
                    </span>
                    <a href={signal.raw_signals?.url} target="_blank" rel="noreferrer" className="view-source">
                      ↗ source
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid #0F1724", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#1E2D40" }}>
            GTM Signal Intelligence Platform
          </span>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#1E2D40" }}>
            FastAPI · Supabase · Groq · React
          </span>
        </div>
      </div>
    </div>
  );
}

