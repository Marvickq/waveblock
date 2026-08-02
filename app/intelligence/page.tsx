"use client";
import { useState, useCallback, useEffect } from "react";
import BlockchainCanvas from "@/components/BlockchainCanvas";

interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
  liquidityUsd: number;
  priceChange24h: number;
  chain: string;
  dex: string;
  pairAddress: string;
  url: string;
}

interface MarketSnapshot {
  address: string;
  symbol: string;
  priceUsd: number;
  volume24h: number;
  liquidityUsd: number;
  priceChange24h: number;
  marketCap: number;
}

interface RecentAnalysis {
  id: string;
  tokenAddress: string;
  tokenName: string | null;
  tokenSymbol: string | null;
  riskLevel: string | null;
  trustScore: number | null;
  createdAt: string;
}

interface IntelligenceResponse {
  network: { gasPriceGwei: number | null; chain: string; chainId: number };
  trending: TrendingToken[];
  market: MarketSnapshot[];
  recentAnalyses: RecentAnalysis[];
  updatedAt: string;
  error?: string;
}

function Skeleton({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`skeleton ${h} ${w} rounded-lg`} />;
}

export default function IntelligencePage() {
  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intelligence?limit=12");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load intelligence data");
        setLoading(false);
        return;
      }
      setData(json);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const riskColor = (score: number | null) => {
    if (score == null) return "var(--wb-color-text-muted)";
    if (score >= 80) return "var(--wb-trust-excellent)";
    if (score >= 60) return "var(--wb-trust-good)";
    if (score >= 40) return "var(--wb-trust-risk)";
    return "var(--wb-trust-critical)";
  };

  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div className="wb-container py-[72px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "0.5rem" }}>
                Live Intelligence
              </h1>
              <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.9375rem" }}>
                Real-time network conditions, trending tokens, and recent security reports.
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              style={{
                background: "var(--wb-color-primary-soft)",
                color: "var(--wb-color-primary)",
                border: "1px solid rgba(79,124,255,0.18)",
                borderRadius: "var(--wb-radius-md)",
                padding: "0.625rem 1.25rem",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          {loading && (
            <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
              <div className="wb-card p-6 space-y-3"><Skeleton h="h-5" w="w-40" /><Skeleton h="h-12" /><Skeleton h="h-12" /><Skeleton h="h-12" /></div>
              <div className="lg:col-span-2 space-y-6">
                <div className="wb-card p-6 space-y-3"><Skeleton h="h-5" w="w-48" />{[1,2,3,4].map((i) => <Skeleton key={i} h="h-10" />)}</div>
              </div>
            </div>
          )}

          {error && (
            <div className="wb-card p-4 mb-8" style={{ border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.07)" }}>
              <p style={{ color: "var(--wb-color-danger)", fontSize: "0.875rem", fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <div className="wb-card p-6">
                  <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Network
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--wb-color-surface)", border: "1px solid var(--wb-color-border)" }}>
                      <div>
                        <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.7rem" }}>Gas Price</p>
                        <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "1rem" }}>
                          {data.network.gasPriceGwei != null ? `${data.network.gasPriceGwei} Gwei` : "Unavailable"}
                        </p>
                      </div>
                      <span style={{ fontSize: "1.4rem" }}>⚡</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--wb-color-surface)", border: "1px solid var(--wb-color-border)" }}>
                      <div>
                        <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.7rem" }}>Chain</p>
                        <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "0.9rem" }}>{data.network.chain}</p>
                      </div>
                      <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--wb-font-mono)" }}>ID {data.network.chainId}</span>
                    </div>
                  </div>
                </div>

                <div className="wb-card p-6">
                  <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Recent Reports
                  </h3>
                  {data.recentAnalyses.length === 0 ? (
                    <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem" }}>No analyses yet. Run a scan on the dashboard.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.recentAnalyses.slice(0, 6).map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--wb-color-surface)", border: "1px solid var(--wb-color-border)" }}>
                          <div className="min-w-0">
                            <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.8rem" }}>{a.tokenName || "Unknown"} <span style={{ color: "var(--wb-color-text-muted)" }}>({a.tokenSymbol || "???"})</span></p>
                            <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.68rem", fontFamily: "var(--wb-font-mono)" }}>{a.tokenAddress.slice(0, 8)}...{a.tokenAddress.slice(-6)}</p>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: "0.8rem", color: riskColor(a.trustScore) }}>
                            {a.trustScore != null ? `${a.trustScore}/100` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="wb-card p-6">
                  <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Trending Tokens
                  </h3>
                  {data.trending.length === 0 ? (
                    <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.875rem" }}>No trending data available right now.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.trending.map((t) => (
                        <a
                          key={t.address}
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg transition-all"
                          style={{ background: "var(--wb-color-surface)", border: "1px solid var(--wb-color-border)", textDecoration: "none" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--wb-color-primary)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--wb-color-border)")}
                        >
                          <div className="flex-1 min-w-0">
                            <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.85rem" }}>{t.name} <span style={{ color: "var(--wb-color-text-muted)" }}>({t.symbol})</span></p>
                            <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.7rem" }}>{t.dex} · ${(t.liquidityUsd / 1000).toFixed(0)}k liq</p>
                          </div>
                          <div className="text-right">
                            <p style={{ fontWeight: 700, color: "var(--wb-color-text-primary)", fontSize: "0.85rem" }}>${t.priceUsd < 0.001 ? t.priceUsd.toExponential(2) : t.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                            <p style={{ fontWeight: 600, fontSize: "0.75rem", color: t.priceChange24h >= 0 ? "var(--wb-color-success)" : "var(--wb-color-danger)" }}>
                              {t.priceChange24h >= 0 ? "▲" : "▼"} {Math.abs(t.priceChange24h).toFixed(1)}%
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="wb-card p-6">
                  <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Market Overview
                  </h3>
                  {data.market.length === 0 ? (
                    <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.875rem" }}>No market data available right now.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="wb-table">
                        <thead>
                          <tr>
                            {["Token", "Price", "24h Volume", "Liquidity", "24h Change"].map((h) => (
                              <th key={h}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.market.map((m) => (
                            <tr key={m.address}>
                              <td>
                                <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.85rem" }}>{m.symbol}</p>
                                <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.68rem", fontFamily: "var(--wb-font-mono)" }}>{m.address.slice(0, 6)}...{m.address.slice(-4)}</p>
                              </td>
                              <td style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.85rem" }}>
                                ${m.priceUsd < 0.001 ? m.priceUsd.toExponential(2) : m.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                              </td>
                              <td style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.85rem" }}>${(m.volume24h / 1000).toFixed(0)}k</td>
                              <td style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.85rem" }}>${(m.liquidityUsd / 1000).toFixed(0)}k</td>
                              <td style={{ fontWeight: 600, fontSize: "0.85rem", color: m.priceChange24h >= 0 ? "var(--wb-color-success)" : "var(--wb-color-danger)" }}>
                                {m.priceChange24h >= 0 ? "▲" : "▼"} {Math.abs(m.priceChange24h).toFixed(1)}%
                              </td>
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

          {data && (
            <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.75rem", marginTop: "1rem" }}>
              Last updated {new Date(data.updatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
