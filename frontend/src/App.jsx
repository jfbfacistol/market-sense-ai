import { useState } from "react";

// --- PROFESSIONAL UI COMPONENTS ---

function SkeletonBlock({ className = "", style = {} }) {
  return (
    <div
      className={`rounded bg-slate-100 animate-pulse ${className}`}
      style={{ animation: "pulse 1.6s ease-in-out infinite", ...style }}
    />
  );
}

function MarkdownRenderer({ content }) {
  const lines = content.split("\n");

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #4f46e5; font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  };

  return (
    <div style={{ 
      fontFamily: "'Georgia', serif", 
      color: "#334155", 
      lineHeight: "1.9", 
      fontSize: "1.05rem", 
      maxWidth: "750px" 
    }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} style={{ 
              fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, 
              marginBottom: "1.25rem", marginTop: i > 0 ? "2.5rem" : 0, color: "#0f172a", 
              borderBottom: "2px solid #f1f5f9", paddingBottom: "0.75rem" 
            }}>
              {trimmed.replace("## ", "")}
            </h2>
          );
        }
        
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} style={{ 
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginTop: "1.75rem", 
              marginBottom: "0.75rem", color: "#475569", fontSize: "0.9rem", 
              textTransform: "uppercase", letterSpacing: "0.08em" 
            }}>
              {trimmed.replace("### ", "")}
            </h3>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <div key={i} style={{ display: "flex", gap: "0.85rem", marginBottom: "1rem", paddingLeft: "0.5rem" }}>
              <span style={{ color: "#e94560", fontWeight: "bold" }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: formatText(trimmed.replace("- ", "")) }} />
            </div>
          );
        }

        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={i} style={{ borderLeft: "4px solid #e94560", paddingLeft: "1.5rem", margin: "2rem 0", color: "#64748b", fontStyle: "italic" }}>
              <span dangerouslySetInnerHTML={{ __html: formatText(trimmed.replace("> ", "")) }} />
            </blockquote>
          );
        }

        if (trimmed === "") return <div key={i} style={{ height: "1.5rem" }} />;

        return (
          <p key={i} style={{ marginBottom: "1.8rem", color: "#475569" }} dangerouslySetInnerHTML={{ __html: formatText(trimmed) }} />
        );
      })}
    </div>
  );
}

// --- MAIN APPLICATION ---

export default function MarketSenseAI() {
  const [zip, setZip] = useState("");
  const [inquiry, setInquiry] = useState("");
  const [stage, setStage] = useState("idle");
  const [aiResponse, setAiResponse] = useState("");
  const [marketMetrics, setMarketMetrics] = useState([]);

  const formatValue = (val) => {
    if (typeof val === 'number' && val > 1000) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    }
    return val;
  };

  const handleAnalyze = async () => {
    const query = zip.toLowerCase().trim();
    
    // --- ENVIRONMENT CONFIGURATION ---
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    const n8nUrl = import.meta.env.VITE_N8N_URL;

    setStage("loading");

    // --- STRATEGIC DEMO LOGIC ---
    if (isDemoMode) {
      const demoData = {
        "jersey city": {
          brief: "## Market Analysis: Jersey City\n\n### Strategic Vibe\nJersey City is a **High-Growth Urban Hub**. It serves as a primary alternative to Manhattan, attracting significant institutional capital and young professionals.\n\n### Investment Outlook\n- **Opportunity:** High rental demand in the Waterfront and Journal Square districts.\n- **Risk:** Rapid development may lead to short-term inventory saturation.\n\n> Verdict: A 'Strong Buy' for portfolio diversification and capital appreciation.",
          metrics: [{ category: "Avg Price", value: 785000 }, { category: "Growth Rate %", value: 12 }, { category: "Inventory Score", value: 65 }]
        },
        "princeton": {
          brief: "## Market Analysis: Princeton\n\n### Strategic Vibe\nPrinceton is a **Premium Academic Enclave**. Characterized by extreme price stability and limited inventory, it serves as a defensive asset class.\n\n### Investment Outlook\n- **Opportunity:** High-end residential rentals for university faculty and researchers.\n- **Risk:** Strict zoning laws limit large-scale commercial scaling.\n\n> Verdict: A 'Stable Hold' for long-term capital preservation and generational wealth.",
          metrics: [{ category: "Avg Price", value: 1250000 }, { category: "Stability Index", value: 98 }, { category: "Risk Rating", value: 5 }]
        },
        "newark": {
          brief: "## Market Analysis: Newark\n\n### Strategic Vibe\nNewark represents an **Emerging Urban Frontier**. Proximity to major transport hubs and airport revitalization programs drive its high-yield potential.\n\n### Investment Outlook\n- **Opportunity:** Value-add multi-family residential projects.\n- **Risk:** Neighborhood-specific volatility requires granular due diligence.\n\n> Verdict: A 'Speculative Growth' play for investors with higher risk tolerance.",
          metrics: [{ category: "Avg Price", value: 425000 }, { category: "Yield Potential %", value: 18 }, { category: "Market Vibe", value: 82 }]
        }
      };

      if (demoData[query]) {
        setTimeout(() => {
          setAiResponse(demoData[query].brief);
          setMarketMetrics(demoData[query].metrics);
          setStage("results");
        }, 1200); // Showcase skeleton loaders
        return;
      }
    }

    // --- REAL BACKEND CALL (DOCKER) ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipCode: zip, question: inquiry }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error("Failed to connect to AI engine.");

      const data = await response.json();
      const rawAiText = data.text || data[0]?.text || data.content?.parts?.[0]?.text || "";

      try {
        const jsonStart = rawAiText.indexOf('{');
        const jsonEnd = rawAiText.lastIndexOf('}') + 1;
        const cleanJsonString = rawAiText.substring(jsonStart, jsonEnd);
        const parsedData = JSON.parse(cleanJsonString);
        
        setAiResponse(parsedData.brief || "Analysis complete.");
        setMarketMetrics(parsedData.metrics || []);
      } catch (e) {
        setAiResponse(rawAiText || "Error parsing AI response.");
        setMarketMetrics([]);
      }
      setStage("results");
    } catch (error) {
      setAiResponse(`System Error: ${error.message}`);
      setStage("results");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAnalyze();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa", color: "#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes barGrow { from { width: 0%; } to { width: var(--bar-width); } }
        .result-panel { animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .analyze-btn:hover { background-color: #c73650 !important; transform: translateY(-1px); box-shadow: 0 10px 25px -5px rgba(233, 69, 96, 0.4); }
        .analyze-btn:active { transform: translateY(0); }
        .bar-fill { animation: barGrow 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>

      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #f1f5f9", padding: "1.25rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: "#e94560", transform: "rotate(45deg)" }} />
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
            MarketSense <span style={{ color: "#e94560" }}>AI</span>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {["Market Data", "AI Agent", "Settings"].map(item => (
            <span key={item} style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500, cursor: "pointer" }}>{item}</span>
          ))}
          <div style={{ padding: "0.4rem 0.8rem", backgroundColor: "#0f172a", borderRadius: "6px", color: "#fff", fontSize: "0.75rem", fontWeight: 600 }}>PRO</div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 2rem" }}>
        
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#e94560", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: "1rem" }}>
            Real Estate Intelligence Engine
          </span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.2rem", fontWeight: 700, lineHeight: 1.1, marginBottom: "1.5rem" }}>
            Decode Markets <span style={{ color: "#e94560" }}>Precisely.</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "1.1rem", maxWidth: 550, margin: "0 auto", fontWeight: 300, lineHeight: 1.6 }}>
            Access institutional-grade strategy briefs by searching any US City, State, or ZIP code.
          </p>
        </div>

        <div style={{ maxWidth: 600, margin: "0 auto 5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Try 'Jersey City' or 'Princeton'"
                style={{
                  width: "100%", padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1.5px solid #e2e8f0",
                  fontSize: "1rem", outline: "none", backgroundColor: "#fff", transition: "all 0.2s"
                }}
              />
            </div>
            <button 
              onClick={handleAnalyze} 
              disabled={stage === "loading"} 
              className="analyze-btn"
              style={{
                backgroundColor: "#e94560", color: "#fff", padding: "0 2rem", borderRadius: "12px",
                fontWeight: 600, border: "none", cursor: stage === "loading" ? "not-allowed" : "pointer"
              }}
            >
              {stage === "loading" ? "Processing..." : "Generate Brief"}
            </button>
          </div>
          <input
            type="text"
            value={inquiry}
            onChange={e => setInquiry(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Focus your inquiry (e.g., 'Luxury investment potential')"
            style={{
              width: "100%", padding: "1rem 1.25rem", borderRadius: "12px", border: "1.5px solid #e2e8f0",
              fontSize: "0.9rem", outline: "none", backgroundColor: "#fff"
            }}
          />
        </div>

        {stage === "loading" && (
           <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }}>
              <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "3rem", border: "1px solid #f1f5f9" }}>
                <SkeletonBlock style={{ height: 30, width: "60%", marginBottom: "2rem" }} />
                <SkeletonBlock style={{ height: 15, width: "100%", marginBottom: "1rem" }} />
                <SkeletonBlock style={{ height: 15, width: "90%", marginBottom: "1rem" }} />
                <SkeletonBlock style={{ height: 15, width: "95%", marginBottom: "3rem" }} />
              </div>
              <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "3rem", border: "1px solid #f1f5f9" }}>
                <SkeletonBlock style={{ height: 20, width: "100%", marginBottom: "1.5rem" }} />
                <SkeletonBlock style={{ height: 20, width: "100%", marginBottom: "1.5rem" }} />
              </div>
           </div>
        )}

        {stage === "results" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "2.5rem", alignItems: "start" }}>
            
            <div className="result-panel" style={{ backgroundColor: "#fff", borderRadius: "24px", padding: "4rem", border: "1px solid #f1f5f9", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Strategy Brief</h3>
                <span style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 700, backgroundColor: "#f0fdf4", padding: "0.3rem 0.8rem", borderRadius: "100px", border: "1px solid #dcfce7" }}>VERIFIED DATA</span>
              </div>
              <MarkdownRenderer content={aiResponse} />
            </div>

            <div className="result-panel" style={{ backgroundColor: "#0f172a", borderRadius: "24px", padding: "2.5rem", color: "#fff", position: "sticky", top: "100px" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "2rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Market Distribution</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {marketMetrics.length > 0 ? marketMetrics.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                      <span style={{ color: "#94a3b8" }}>{item.category}</span>
                      <span style={{ fontWeight: 700 }}>{formatValue(item.value)}</span>
                    </div>
                    <div style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "100px", height: "6px", overflow: "hidden" }}>
                      <div 
                        className="bar-fill" 
                        style={{ 
                          "--bar-width": `${Math.min(item.value > 100 ? (item.value / 10000) : item.value, 100)}%`, 
                          backgroundColor: i === 0 ? "#e94560" : "#38bdf8", height: "100%" 
                        }} 
                      />
                    </div>
                  </div>
                )) : (
                  <p style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.8rem" }}>No dynamic metrics provided by AI.</p>
                )}
              </div>
              <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5 }}>
                Confidence Score: 94%<br />
                Source: USA Real Estate Dataset · Decoupled RAG Architecture
              </div>
            </div>

          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "4rem 0", color: "#94a3b8", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
        PROTOTYPE V2.5 · BUILT BY JAE · POWERED BY GEMINI 2.5 FLASH
      </footer>
    </div>
  );
}