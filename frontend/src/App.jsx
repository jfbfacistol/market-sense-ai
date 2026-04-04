import { useState } from "react";

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

  return (
    <div style={{ fontFamily: "'Georgia', serif", color: "#1e293b", lineHeight: 1.75, fontSize: "0.92rem" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", marginTop: i > 0 ? "1.25rem" : 0, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.4rem" }}>{line.replace("## ", "")}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, marginTop: "1rem", marginBottom: "0.3rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>{line.replace("### ", "")}</h3>;
        if (line.startsWith("> ")) return <blockquote key={i} style={{ borderLeft: "3px solid #e94560", paddingLeft: "1rem", margin: "1rem 0", color: "#64748b", fontStyle: "italic", fontSize: "0.85rem" }}>{line.replace("> ", "").replace(/\*/g, "")}</blockquote>;
        if (line.startsWith("- ")) {
          const text = line.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
          return <li key={i} style={{ marginBottom: "0.35rem", paddingLeft: "0.5rem" }} dangerouslySetInnerHTML={{ __html: text }} />;
        }
        if (line === "") return <div key={i} style={{ height: "0.5rem" }} />;
        const text = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
        return <p key={i} style={{ marginBottom: "0.4rem" }} dangerouslySetInnerHTML={{ __html: text }} />;
      })}
    </div>
  );
}

export default function MarketSenseAI() {
  const [zip, setZip] = useState("");
  const [inquiry, setInquiry] = useState("");
  const [stage, setStage] = useState("idle");
  const [inputFocused, setInputFocused] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [marketMetrics, setMarketMetrics] = useState([]); // <-- ADDED: State for dynamic chart

  const handleAnalyze = async () => {
    if (!zip.trim()) return;
    setStage("loading");

    try {
      const response = await fetch("/webhook/strategy-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipCode: zip, question: inquiry })
      });

      if (!response.ok) throw new Error("Failed to reach server.");

      const data = await response.json();
      console.log("BRAIN OUTPUT:", data);

      const rawAiText = 
        data.text || 
        data[0]?.text || 
        data.content?.parts?.[0]?.text || 
        data[0]?.content?.parts?.[0]?.text || 
        "";

      try {
        const jsonStart = rawAiText.indexOf('{');
        const jsonEnd = rawAiText.lastIndexOf('}') + 1;
        const cleanJsonString = rawAiText.substring(jsonStart, jsonEnd);
        
        const parsedData = JSON.parse(cleanJsonString);
        
        setAiResponse(parsedData.brief || "Analysis complete.");
        setMarketMetrics(parsedData.metrics || []); // <-- ADDED: Saves Gemini's chart data
        
      } catch (parseError) {
        console.error("AI didn't send valid JSON:", rawAiText);
        setAiResponse(rawAiText || "Received data, but it wasn't formatted as JSON.");
        setMarketMetrics([]);
      }

      setStage("results");
    } catch (error) {
      console.error(error);
      setAiResponse(`Error: ${error.message}`);
      setStage("results");
    }
  }; // <-- ADDED: Missing closing bracket for handleAnalyze

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAnalyze();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes barGrow { from { width: 0%; } to { width: var(--bar-width); } }
        .result-panel { animation: fadeSlideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .result-panel:nth-child(2) { animation-delay: 0.1s; }
        .analyze-btn:hover { background-color: #c73650 !important; box-shadow: 0 6px 24px rgba(233, 69, 96, 0.35) !important; transform: translateY(-1px); }
        .analyze-btn:active { transform: translateY(0); }
        .analyze-btn { transition: all 0.18s ease; }
        .bar-fill { animation: barGrow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
      `}</style>

      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#e94560", display: "inline-block", marginBottom: 2 }} />
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
              MarketSense <span style={{ color: "#e94560" }}>AI</span>
            </h1>
          </div>
          <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: "2px 0 0 1.2rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>
            GenAI Enablement Prototype
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {["Overview", "Docs", "API"].map(item => (
            <span key={item} style={{ fontSize: "0.8rem", color: "#64748b", cursor: "pointer", fontWeight: 500 }}>{item}</span>
          ))}
          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 600 }}>TM</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "4rem 1.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-block", backgroundColor: "#fff0f3", border: "1px solid #fecdd3", borderRadius: 100, padding: "0.3rem 0.9rem", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.7rem", color: "#e94560", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>● Live Intelligence Engine</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 5vw, 2.85rem)", fontWeight: 700, color: "#0f172a", lineHeight: 1.2, margin: "0 0 0.9rem", letterSpacing: "-0.02em" }}>
            Decode Any Local Market<br />
            <span style={{ color: "#e94560" }}>in Seconds.</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: 480, margin: "0 auto", lineHeight: 1.65, fontWeight: 300 }}>
            Enter a US ZIP code to generate AI-powered market intelligence, demand signals, and strategic recommendations.
          </p>
        </div>

        {/* Unified Input Area */}
        <div style={{ maxWidth: 540, margin: "0 auto 3.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#e94560", fontWeight: "bold" }}>📍</span>
            <input
              type="text"
              value={zip}
              onChange={e => setZip(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Enter ZIP code (e.g., 90210)"
              style={{
                width: "100%", padding: "0.9rem 1rem 0.9rem 2.5rem", 
                border: inputFocused ? "2px solid #e94560" : "1.5px solid #e2e8f0",
                borderRadius: 10, fontSize: "1rem", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>💬</span>
            <input
              type="text"
              value={inquiry}
              onChange={e => setInquiry(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI anything about this market..."
              style={{
                width: "100%", padding: "0.9rem 1rem 0.9rem 2.5rem", border: "1.5px solid #e2e8f0",
                borderRadius: 10, fontSize: "0.95rem", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={stage === "loading"} 
            className={`analyze-btn w-full py-3 rounded-lg font-semibold transition-all 
              ${stage === "loading" 
                ? "bg-rose-300 cursor-not-allowed text-white" 
                : "bg-rose-500 text-white" 
              }`}
          >
            {stage === "loading" ? "Analyzing Market..." : "Analyze Market →"}
          </button>
        </div>

        {/* Skeleton Loader */}
        {stage === "loading" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {[0, 1].map(col => (
              <div key={col} style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "1.75rem" }}>
                <SkeletonBlock style={{ height: 16, width: "40%", marginBottom: "1.25rem", borderRadius: 6 }} />
                {[90, 75, 60, 85, 50, 70, 45].map((w, i) => (
                  <div key={i} style={{ height: 12, width: `${w}%`, marginBottom: "0.65rem", borderRadius: 4, backgroundColor: "#f1f5f9" }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {stage === "results" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="result-panel" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, margin: 0 }}>Strategy Brief</h3>
                <div style={{ backgroundColor: "#f0fdf4", borderRadius: 20, padding: "0.2rem 0.65rem" }}>
                  <span style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: 600 }}>✓ Generated</span>
                </div>
              </div>
              <MarkdownRenderer content={aiResponse} />
            </div>

            <div className="result-panel" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "1.75rem" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Market Distribution</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                
                {/* Fallback if AI didn't return metrics */}
                {marketMetrics.length === 0 && (
                  <p style={{ color: "#64748b", fontSize: "0.85rem", fontStyle: "italic" }}>No specific metrics found in data.</p>
                )}

                {/* DYNAMIC CHART: Looping over Gemini's JSON data */}
                {marketMetrics.map((item, i) => {
                  const colors = ["#e94560", "#1a1a2e", "#6b7280", "#9ca3af"];
                  const barColor = colors[i % colors.length];
                  const visualWidth = typeof item.value === 'number' ? Math.min(item.value, 100) : 50;

                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.78rem" }}>
                        <span>{item.category || item.label}</span>
                        <span style={{ fontWeight: 700 }}>{item.value}</span>
                      </div>
                      <div style={{ backgroundColor: "#f1f5f9", borderRadius: 100, height: 8, overflow: "hidden" }}>
                        <div className="bar-fill" style={{ "--bar-width": `${visualWidth}%`, width: `${visualWidth}%`, height: "100%", borderRadius: 100, backgroundColor: barColor }} />
                      </div>
                    </div>
                  );
                })}
                
              </div>
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "3rem 1.5rem 2rem", color: "#cbd5e1", fontSize: "0.72rem" }}>
        MARKETSENSE AI · GENAI ENABLEMENT PROTOTYPE · NOT FOR PRODUCTION USE
      </footer>
    </div>
  );
}