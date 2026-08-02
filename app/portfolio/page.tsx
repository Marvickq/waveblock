"use client";
import { useState, useCallback, useEffect } from "react";
import BlockchainCanvas from "@/components/BlockchainCanvas";
import TrustScoreGauge from "@/components/TrustScoreGauge";

interface Holding {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  priceUsd: number;
  usdValue: number;
  trustScore: number;
  riskLevel: string;
}

interface PortfolioResponse {
  totalTokens: number;
  totalValueUsd: number;
  portfolioHealthScore: number;
  overallRiskScore: number;
  highRiskHoldings: number;
  whaleConcentration: number;
  largestPositions: { address: string; symbol: string; name: string; usdValue: number; percentage: number; trustScore: number; riskLevel: string }[];
  suspiciousAssets: { address: string; symbol: string; name: string; reason: string }[];
  diversificationScore: number;
  holdings: Holding[];
  aiSummary: string;
  error?: string;
}

function Skeleton({ h = "h-4", w = "w-full", className = "" }: { h?: string; w?: string; className?: string }) {
  return <div className={`skeleton ${h} ${w} ${className} rounded-2xl`} />;
}

function RiskChip({ level }: { level: string }) {
  const chipClasses: Record<string, string> = {
    Low: "risk-low",
    Medium: "risk-medium",
    High: "risk-high",
    Critical: "risk-critical",
  };
  const cls = chipClasses[level] || "risk-medium";
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-sm ${cls}`}>
      {level}
    </span>
  );
}

export default function PortfolioPage() {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const w = localStorage.getItem("wb_wallet");
    if (w) setWallet(w);
  }, []);

  const scanPortfolio = useCallback(async (addr?: string) => {
    const input = (addr || wallet).trim();
    if (!input) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: input }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Portfolio scan failed");
        setLoading(false);
        return;
      }
      setData(result);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }, [wallet]);

  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div className="wb-container mx-auto px-6 md:px-12 py-[96px]" style={{ maxWidth: "1400px" }}>
          <div className="mb-[2px]">
            <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
              Portfolio Guardian
            </h1>
            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.05rem", marginBottom: "0" }}>
              Scan a wallet to evaluate every holding for security risks, liquidity and concentration.
            </p>
          </div>

          <div className="wb-card p-8 md:p-10 mb-[64px] rounded-2xl flex flex-col items-center enterprise-card mt-[24px]">
            <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-5 items-stretch justify-center">
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scanPortfolio()}
                placeholder="Enter wallet address (e.g. 0x28C6c062...)"
                className="wb-input flex-1"
                style={{
                  padding: "1rem 1.5rem", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "1rem", fontFamily: "var(--wb-font-ui)",
                  fontSize: "1.05rem", background: "rgba(0,0,0,0.2)",
                  outline: "none", transition: `all var(--wb-duration-fast) var(--wb-ease-standard)`,
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--wb-color-primary)"; e.target.style.boxShadow = "0 0 15px rgba(79,124,255,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                onClick={() => scanPortfolio()}
                disabled={loading}
                style={{
                  background: loading ? "var(--wb-color-text-disabled)" : "rgba(255,255,255,0.03)",
                  color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem",
                  padding: "1rem 2.5rem", fontWeight: 600, fontSize: "1.05rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                  transition: `all var(--wb-duration-fast) var(--wb-ease-standard)`,
                }}
                onMouseEnter={(e) => {
                  if(!loading) {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--wb-color-primary)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(79,124,255,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if(!loading) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }
                }}
              >
                {loading ? (
                  <>
                    <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Scanning…
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--wb-color-primary)" strokeWidth="2.5">
                      <path d="M3 3v18h18" />
                      <path d="M7 15l4-6 3 4 3-7" />
                    </svg>
                    Scan Portfolio
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="wb-card p-6 mb-8 rounded-2xl" style={{ border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.07)" }}>
              <p style={{ color: "var(--wb-color-danger)", fontSize: "1rem", fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {loading && (
            <div className="grid lg:grid-cols-[35%_1fr] gap-[32px]">
              <div className="wb-card p-8 flex flex-col items-center gap-6 rounded-2xl">
                <Skeleton h="h-48" w="w-48" className="rounded-full" />
                <Skeleton h="h-6" w="w-32" />
                <Skeleton h="h-4" w="w-48" />
              </div>
              <div className="space-y-[40px]">
                <div className="wb-card p-8 space-y-6 rounded-2xl"><Skeleton h="h-7" w="w-64" /><Skeleton h="h-32" /></div>
                <div className="wb-card p-8 space-y-8 rounded-2xl"><Skeleton h="h-7" w="w-48" />{[1,2,3].map((i) => <Skeleton key={i} h="h-10" />)}</div>
              </div>
            </div>
          )}

          {data && !loading && (
            <div className="grid lg:grid-cols-[35%_1fr] gap-[32px]">
              <div className="space-y-[40px]">
                <div className="wb-card p-8 text-center rounded-2xl enterprise-card">
                  <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>
                    Health Score
                  </h3>
                  <TrustScoreGauge score={data.portfolioHealthScore} size={220} animated />
                  <div className="mt-8 grid grid-cols-2 gap-5">
                    <div className="rounded-xl p-5 text-center transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Total Value</p>
                      <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "1.2rem" }}>${data.totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="rounded-xl p-5 text-center transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Risk Score</p>
                      <p style={{ color: data.overallRiskScore > 60 ? "var(--wb-color-danger)" : "var(--wb-color-warning)", fontWeight: 700, fontSize: "1.2rem" }}>{data.overallRiskScore}/100</p>
                    </div>
                    <div className="rounded-xl p-5 text-center transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Tokens</p>
                      <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "1.2rem" }}>{data.totalTokens}</p>
                    </div>
                    <div className="rounded-xl p-5 text-center transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Diversification</p>
                      <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "1.2rem" }}>{data.diversificationScore}%</p>
                    </div>
                  </div>
                </div>

                <div className="wb-card p-8 rounded-2xl enterprise-card">
                  <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>
                    AI Summary
                  </h3>
                  <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>{data.aiSummary}</p>
                </div>
              </div>

              <div className="space-y-[40px]">
                <div className="wb-card p-8 rounded-2xl enterprise-card">
                  <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>
                    Largest Positions
                  </h3>
                  {data.largestPositions.length === 0 ? (
                    <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.95rem" }}>No holdings found.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.largestPositions.map((p) => (
                        <div key={p.address} className="flex items-center gap-4 p-4 rounded-xl transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.95rem", marginBottom: "0.25rem" }}>{p.name} <span style={{ color: "var(--wb-color-text-muted)" }}>({p.symbol})</span></p>
                            <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", fontFamily: "var(--wb-font-mono)" }}>{p.address.slice(0, 8)}...{p.address.slice(-6)}</p>
                          </div>
                          <div className="text-right mr-4">
                            <p style={{ fontWeight: 700, color: "var(--wb-color-text-primary)", fontSize: "1.05rem", marginBottom: "0.25rem" }}>${p.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem" }}>{p.percentage}% of portfolio</p>
                          </div>
                          <RiskChip level={p.riskLevel} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {data.suspiciousAssets.length > 0 && (
                  <div className="wb-card p-8 rounded-2xl" style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
                    <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-danger)", fontSize: "1.2rem" }}>
                      🚨 Suspicious Assets ({data.suspiciousAssets.length})
                    </h3>
                    <div className="space-y-4">
                      {data.suspiciousAssets.map((s) => (
                        <div key={s.address} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                          <span style={{ fontSize: "1.2rem", marginTop: "2px" }}>⚠️</span>
                          <div className="flex-1">
                            <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.95rem", marginBottom: "0.4rem" }}>{s.name} ({s.symbol})</p>
                            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{s.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="wb-card p-8 rounded-2xl enterprise-card overflow-hidden">
                  <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>
                    All Holdings
                  </h3>
                  {data.holdings.length === 0 ? (
                    <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.95rem" }}>No holdings found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {["Asset", "Balance", "Price", "Value", "Risk"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "1rem 1rem", color: "var(--wb-color-text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--wb-tracking-wide)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.holdings.map((h) => (
                            <tr key={h.address} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }} className="transition-all hover:bg-[rgba(255,255,255,0.02)]">
                              <td style={{ padding: "1rem 1rem" }}>
                                <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.95rem", marginBottom: "0.25rem" }}>{h.name}</p>
                                <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", fontFamily: "var(--wb-font-mono)" }}>{h.symbol}</p>
                              </td>
                              <td style={{ padding: "1rem 1rem", color: "var(--wb-color-text-secondary)", fontSize: "0.95rem" }}>
                                {parseFloat(h.balance) >= 1000 ? (parseFloat(h.balance) / 1000).toFixed(2) + "k" : parseFloat(h.balance).toFixed(4)}
                              </td>
                              <td style={{ padding: "1rem 1rem", color: "var(--wb-color-text-secondary)", fontSize: "0.95rem" }}>
                                ${h.priceUsd < 0.001 ? h.priceUsd.toExponential(2) : h.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                              </td>
                              <td style={{ padding: "1rem 1rem", color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "0.95rem" }}>
                                ${h.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td style={{ padding: "1rem 1rem" }}><RiskChip level={h.riskLevel} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!data && !loading && !error && (
            <div className="text-center py-24 wb-card rounded-2xl enterprise-card">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: "rgba(79,124,255,0.05)", border: "1px solid rgba(79,124,255,0.15)" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--wb-color-primary)" strokeWidth="1.5">
                  <path d="M3 3v18h18" />
                  <path d="M7 15l4-6 3 4 3-7" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.6rem", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem" }}>
                Scan your portfolio
              </h2>
              <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.05rem", lineHeight: 1.6 }}>
                Enter any wallet address above to evaluate its holdings for security risks.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .enterprise-card {
          border: 1px solid rgba(255,255,255,0.06) !important;
          background: var(--wb-color-surface) !important;
          box-shadow: none !important;
        }
        .enterprise-card:hover {
          border-color: rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </div>
  );
}
