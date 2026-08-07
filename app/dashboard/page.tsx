"use client";
import { useState, useCallback, useEffect } from "react";
import BlockchainCanvas from "@/components/BlockchainCanvas";
import TrustScoreGauge from "@/components/TrustScoreGauge";
import AITypingReport from "@/components/AITypingReport";
import type { TokenAnalysis, RiskLevel } from "@/types";

/* ── Skeleton ───────────────────────────────────────────── */
function Skeleton({ h = "h-4", w = "w-full", className = "" }: { h?: string; w?: string; className?: string }) {
  return <div className={`skeleton ${h} ${w} ${className} rounded-2xl`} />;
}

/* ── Risk Bar ───────────────────────────────────────────── */
function RiskBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-2">
        <span style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.95rem", fontWeight: 500 }}>{label}</span>
        <span style={{ color, fontSize: "0.95rem", fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: "8px", background: "var(--wb-color-border)", borderRadius: "4px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: color,
            borderRadius: "4px",
            transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Holder Donut ───────────────────────────────────────── */
function HolderDonut({ holders }: { holders: TokenAnalysis["holders"] }) {
  const r = 60, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-10">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--wb-color-border)" strokeWidth="22" />
        {holders.map((h) => {
          const dash = (h.pct / 100) * circ;
          const gap = circ - dash;
          const seg = (
            <circle
              key={h.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={h.color}
              strokeWidth="22"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ filter: `drop-shadow(0 0 4px ${h.color}40)` }}
            />
          );
          offset += dash;
          return seg;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: "var(--wb-font-ui)", fontSize: "11px", fill: "var(--wb-color-text-muted)", fontWeight: 500 }}>
          Holders
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontFamily: "var(--wb-font-ui)", fontSize: "16px", fill: "var(--wb-color-text-primary)", fontWeight: 700 }}>
          {holders[0]?.pct}%
        </text>
        <text x={cx} y={cy + 28} textAnchor="middle" style={{ fontFamily: "var(--wb-font-ui)", fontSize: "10px", fill: "var(--wb-color-text-muted)" }}>
          top wallet
        </text>
      </svg>

      <div className="flex-1 space-y-4 w-full">
        {holders.map((h) => (
          <div key={h.label} className="flex items-center gap-4">
            <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: h.color }} />
            <span style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.95rem", flex: 1 }}>{h.label}</span>
            <span style={{ color: "var(--wb-color-text-primary)", fontSize: "0.95rem", fontWeight: 700 }}>{h.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Status Chip ────────────────────────────────────────── */
function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.95rem" }}>{label}</span>
      <span
        className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide"
        style={{
          background: ok ? "rgba(24,195,126,0.10)" : "rgba(239,68,68,0.10)",
          color: ok ? "var(--wb-color-success)" : "var(--wb-color-danger)",
          border: `1px solid ${ok ? "rgba(24,195,126,0.20)" : "rgba(239,68,68,0.20)"}`,
        }}
      >
        {ok ? "✓ Yes" : "✗ No"}
      </span>
    </div>
  );
}

/* ── Recent Analyses ────────────────────────────────────── */
function RecentAnalyses({ recent, onSelect }: { recent: { address: string; name: string; score: number }[]; onSelect: (a: string) => void }) {
  if (!recent.length) return null;
  return (
    <div className="wb-card p-8 rounded-2xl enterprise-card">
      <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>Recent Searches</h3>
      <div className="space-y-4">
        {recent.map((r) => (
          <button
            key={r.address}
            onClick={() => onSelect(r.address)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl text-left transition-all duration-300"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,124,255,0.3)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 15px rgba(79,124,255,0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div>
              <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.95rem", marginBottom: "4px" }}>{r.name}</p>
              <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", fontFamily: "var(--wb-font-mono)" }}>{r.address.slice(0, 10)}...{r.address.slice(-6)}</p>
            </div>
            <span style={{
              fontWeight: 700, fontSize: "1.05rem",
              color: r.score >= 80 ? "var(--wb-trust-excellent)" : r.score >= 60 ? "var(--wb-trust-review)" : "var(--wb-trust-critical)"
            }}>
              {r.score}/100
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Swap Preview ───────────────────────────────────────── */
function SwapPreview({ token }: { token: TokenAnalysis }) {
  const [ethAmount, setEthAmount] = useState("0.1");
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [priceSource, setPriceSource] = useState<"live" | "unavailable">("unavailable");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tRes, eRes] = await Promise.all([
          fetch(`/api/price?address=${token.address}`),
          fetch(`/api/price?address=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`),
        ]);
        if (cancelled) return;
        const tJson = await tRes.json();
        const eJson = await eRes.json();
        if (tRes.ok && eRes.ok && typeof tJson.priceUsd === "number" && typeof eJson.priceUsd === "number") {
          setTokenPrice(tJson.priceUsd);
          setEthPrice(eJson.priceUsd);
          setPriceSource("live");
        }
      } catch {
        // Price lookup failed — show unavailable state
      }
    })();
    return () => { cancelled = true; };
  }, [token.address]);

  const tokenOut = tokenPrice && ethPrice ? ((parseFloat(ethAmount) || 0) * ethPrice) / tokenPrice : null;
  const afterTax = tokenOut != null ? tokenOut * (1 - token.buyTax / 100) : null;

  return (
    <div className="wb-card p-8 rounded-2xl enterprise-card">
      <div className="flex items-center gap-3 mb-6">
        <span style={{ fontSize: "1.25rem" }}>🔄</span>
        <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>Swap Preview</h3>
        <span
          className="ml-auto px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: priceSource === "live" ? "rgba(24,195,126,0.10)" : "rgba(245,185,66,0.10)", color: priceSource === "live" ? "var(--wb-color-success)" : "var(--wb-color-warning)", border: `1px solid ${priceSource === "live" ? "rgba(24,195,126,0.20)" : "rgba(245,185,66,0.20)"}` }}
        >
          {priceSource === "live" ? "Live Prices" : "No Live Price"}
        </span>
      </div>

      <div className="space-y-4 mb-8">
        <div className="wb-input flex items-center gap-4 rounded-xl px-5 py-4" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
          <span style={{ fontSize: "1.1rem" }}>⟠</span>
          <input
            type="number"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontFamily: "var(--wb-font-ui)", fontSize: "1.1rem", background: "transparent", color: "var(--wb-color-text-primary)" }}
            placeholder="0.0"
          />
          <span style={{ color: "var(--wb-color-text-secondary)", fontWeight: 600, fontSize: "1rem" }}>ETH</span>
        </div>

        <div className="text-center" style={{ color: "var(--wb-color-text-muted)", fontSize: "1rem" }}>↓</div>

        <div className="rounded-xl px-5 py-4" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between items-center">
            {afterTax != null ? (
              <span style={{ color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>{afterTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            ) : (
              <span style={{ color: "var(--wb-color-text-muted)", fontWeight: 600, fontSize: "1rem" }}>Price unavailable</span>
            )}
            <span style={{ color: "var(--wb-color-text-secondary)", fontWeight: 600, fontSize: "1rem" }}>{token.symbol}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-[0.95rem]" style={{ color: "var(--wb-color-text-muted)" }}>
        <div className="flex justify-between"><span>Token Price</span><span>{tokenPrice != null ? `$${tokenPrice < 0.001 ? tokenPrice.toExponential(2) : tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : "—"}</span></div>
        <div className="flex justify-between"><span>ETH Price</span><span>{ethPrice != null ? `$${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}</span></div>
        <div className="flex justify-between"><span>Buy Tax</span><span style={{ color: token.buyTax > 5 ? "var(--wb-color-danger)" : "var(--wb-color-success)", fontWeight: 500 }}>{token.buyTax}%</span></div>
        <div className="flex justify-between"><span>Min Received</span><span>{afterTax != null ? `${(afterTax * 0.995).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${token.symbol}` : "—"}</span></div>
      </div>

      {token.isHoneypot && (
        <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p style={{ color: "#DC2626", fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.6 }}>⚠️ Honeypot Alert: Sells may be blocked. This swap simulation is for reference only.</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [address, setAddress]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [analysis, setAnalysis] = useState<TokenAnalysis | null>(null);
  const [wallet, setWallet]     = useState<string | null>(null);
  const [recent, setRecent]     = useState<{ address: string; name: string; score: number }[]>([]);

  useEffect(() => {
    const w = localStorage.getItem("wb_wallet");
    if (w) setWallet(w);
    const r = localStorage.getItem("wb_recent");
    if (r) setRecent(JSON.parse(r));
  }, []);

  const analyseToken = useCallback(async (addr: string) => {
    const input = addr || address;
    if (!input.trim()) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: input }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Analysis failed");
        setLoading(false);
        return;
      }

      const result: TokenAnalysis = await res.json();
      setAnalysis(result);
      setLoading(false);

      const updated = [{ address: input, name: result.name, score: result.trustScore }, ...recent.filter((r) => r.address !== input)].slice(0, 5);
      setRecent(updated);
      localStorage.setItem("wb_recent", JSON.stringify(updated));
    } catch (err) {
      console.error("Analysis error:", err);
      alert("Network error. Please try again.");
      setLoading(false);
    }
  }, [address, recent]);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet(null);
        localStorage.removeItem("wb_wallet");
      } else {
        setWallet(accounts[0]);
        localStorage.setItem("wb_wallet", accounts[0]);
      }
    };

    const handleChainChanged = () => window.location.reload();

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  async function connectWallet() {
    if (typeof window === "undefined") return;
    const win = window as any;
    let provider: any = null;
    if (win.ethereum?.providers?.length) {
      provider = win.ethereum.providers.find((p: any) => p.isMetaMask) ?? win.ethereum.providers[0];
    } else if (win.ethereum) {
      provider = win.ethereum;
    }
    if (!provider) {
      let inIframe = false;
      try { inIframe = window.self !== window.top; } catch { inIframe = true; }
      alert(inIframe
        ? "Wallet connection is unavailable in preview environments. Open the app in a full browser tab."
        : "No Ethereum wallet detected. Please install MetaMask or another Web3 wallet."
      );
      return;
    }
    try {
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      if (accounts?.[0]) {
        setWallet(accounts[0]);
        localStorage.setItem("wb_wallet", accounts[0]);
      }
    } catch (err: any) {
      if (err?.code === 4001) return;
      console.error("Wallet connection failed:", err);
    }
  }

  const riskColor = (r: RiskLevel) => ({ Low: "#10B981", Medium: "#F59E0B", High: "#EF4444", Critical: "#B91C1C" }[r]);
  const riskClass = (r: RiskLevel) => ({ Low: "risk-low", Medium: "risk-medium", High: "risk-high", Critical: "risk-critical" }[r]);

  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div className="wb-container mx-auto px-6 md:px-12 py-[96px]" style={{ maxWidth: "1400px" }}>

          {/* ── Row 1: Header ──────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-[2px]">
            <div>
              <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
                Token Analysis Dashboard
              </h1>
              <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.05rem", marginBottom: "0" }}>
                Paste any ERC-20 contract address to receive an AI-generated Trust Report.
              </p>
            </div>

            {/* Wallet status */}
            {wallet ? (
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                style={{ background: "rgba(24,195,126,0.10)", border: "1px solid rgba(24,195,126,0.20)" }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--wb-color-success)", boxShadow: "0 0 8px var(--wb-color-success)" }} />
                <span style={{ color: "var(--wb-color-success)", fontWeight: 600, fontSize: "0.95rem", fontFamily: "var(--wb-font-mono)" }}>
                  {wallet.slice(0, 6)}...{wallet.slice(-4)}
                </span>
                <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem" }}>Connected</span>
              </div>
            ) : (
              <button
                id="dashboard-connect-wallet"
                onClick={connectWallet}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:bg-[rgba(255,255,255,0.05)]"
                style={{ background: "rgba(255,255,255,0.02)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                Connect Wallet
              </button>
            )}
          </div>

          {/* ── Row 2: Search ──────────────────────────────────────────── */}
          <div className="wb-card p-8 md:p-10 mb-[64px] rounded-2xl flex flex-col items-center enterprise-card mt-[24px]">
            <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-5 items-stretch justify-center">
              <input
                id="token-search-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyseToken(address)}
                placeholder="Enter token contract address (e.g. 0x6982...)"
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
                id="analyse-token-btn"
                onClick={() => analyseToken(address)}
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
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    Analyse Token
                  </>
                )}
              </button>
            </div>

            {/* Demo shortcuts */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.95rem", fontWeight: 500 }}>Example Tokens:</span>
              {[
                { label: "PEPE (Safe)", addr: "0x6982508145454Ce325dDbE47a25d4ec3d2311933" },
                { label: "SAFEMOON (Danger)", addr: "0xDeAdBeEf0000000000000000000000000000dEaD" },
              ].map(({ label, addr }) => (
                <button
                  key={addr}
                  onClick={() => { setAddress(addr); analyseToken(addr); }}
                  className="transition-all hover:bg-[rgba(79,124,255,0.1)]"
                  style={{
                    background: "rgba(79,124,255,0.05)", border: "1px solid rgba(79,124,255,0.15)",
                    borderRadius: "0.5rem", padding: "0.5rem 1.25rem", fontSize: "0.9rem",
                    color: "var(--wb-color-primary)", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Row 3: 35 / 65 Grid Layout ──────────────────────────────── */}
          <div className="grid lg:grid-cols-[35%_1fr] gap-[32px]">

            {/* ================= LEFT COLUMN ================= */}
            <div className="space-y-[40px]">
              {loading ? (
                <>
                  <div className="wb-card p-8 flex flex-col items-center gap-6 rounded-2xl">
                    <Skeleton h="h-48" w="w-48" className="rounded-full" />
                    <Skeleton h="h-6" w="w-32" />
                    <Skeleton h="h-4" w="w-48" />
                  </div>
                  <div className="wb-card p-8 space-y-6 rounded-2xl">
                    <Skeleton h="h-6" w="w-40" />
                    {[1,2,3,4].map((i) => (<div key={i} className="flex justify-between"><Skeleton h="h-4" w="w-40" /><Skeleton h="h-4" w="w-16" /></div>))}
                  </div>
                </>
              ) : analysis ? (
                <>
                  {/* Score Card */}
                  <div className="wb-card p-8 text-center rounded-2xl enterprise-card">
                    <div className="flex flex-col xl:flex-row items-center xl:justify-between gap-5 mb-8">
                      <div className="text-center xl:text-left">
                        <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.5rem", fontWeight: 600, color: "var(--wb-color-text-primary)", marginBottom: "0.4rem" }}>
                          {analysis.name}
                        </h2>
                        <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.9rem", fontFamily: "var(--wb-font-mono)" }}>
                          {analysis.address.slice(0, 8)}...{analysis.address.slice(-6)}
                        </p>
                      </div>
                      <span className={`px-5 py-2 rounded-full text-sm font-bold shadow-sm ${riskClass(analysis.riskLevel)}`}>
                        {analysis.riskLevel} Risk
                      </span>
                    </div>
                    <TrustScoreGauge score={analysis.trustScore} size={220} animated />
                  </div>

                  {/* Contract / Ownership */}
                  <div className="wb-card p-8 rounded-2xl enterprise-card">
                    <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>
                      Contract Analysis
                    </h3>
                    <div className="space-y-2 mb-8">
                      <StatusChip ok={analysis.contractVerified}  label="Contract Verified" />
                      <StatusChip ok={analysis.ownershipRenounced} label="Ownership Renounced" />
                      <StatusChip ok={analysis.liquidityLocked}    label="Liquidity Locked" />
                      <StatusChip ok={!analysis.isHoneypot}        label="Not a Honeypot" />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      {[
                        { label: "Buy Tax", value: `${analysis.buyTax}%`, warn: analysis.buyTax > 5 },
                        { label: "Sell Tax", value: `${analysis.sellTax}%`, warn: analysis.sellTax > 5 },
                        { label: "Liquidity", value: `$${(analysis.liquidityUSD / 1e6).toFixed(1)}M`, warn: false },
                        { label: "Holders", value: analysis.holderCount.toLocaleString(), warn: false },
                      ].map(({ label, value, warn }) => (
                        <div key={label} className="rounded-xl p-5 text-center transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: 500 }}>{label}</p>
                          <p style={{ color: warn ? "var(--wb-color-danger)" : "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  <RecentAnalyses recent={recent} onSelect={(a) => { setAddress(a); analyseToken(a); }} />
                </>
              ) : (
                <>
                  <div className="wb-card p-10 text-center flex flex-col items-center justify-center min-h-[300px] rounded-2xl enterprise-card">
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center mb-8"
                      style={{ background: "rgba(79,124,255,0.05)", border: "1px solid rgba(79,124,255,0.15)" }}
                    >
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--wb-color-primary)" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                    </div>
                    <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.6rem", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem" }}>
                      Ready to Analyse
                    </h2>
                    <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.05rem", lineHeight: 1.6 }}>
                      Awaiting token contract address to begin AI-powered security scanning.
                    </p>
                  </div>

                  <RecentAnalyses recent={recent} onSelect={(a) => { setAddress(a); analyseToken(a); }} />
                </>
              )}
            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="space-y-[40px]">
              {loading ? (
                <>
                  <div className="wb-card p-8 space-y-6 rounded-2xl">
                    <Skeleton h="h-7" w="w-64" />
                    <Skeleton h="h-48" />
                  </div>
                  <div className="wb-card p-8 space-y-8 rounded-2xl">
                    <Skeleton h="h-7" w="w-48" />
                    {[1,2,3,4,5].map((i) => (<Skeleton key={i} h="h-10" />))}
                  </div>
                </>
              ) : analysis ? (
                <>
                  {/* AI Report */}
                  <div className="wb-card p-8 rounded-2xl enterprise-card">
                    <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>
                      AI Trust Report
                    </h3>
                    <AITypingReport report={analysis.aiReport} speed={14} />
                  </div>

                  {/* Risk Breakdown */}
                  <div className="wb-card p-8 rounded-2xl enterprise-card">
                    <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>
                      Risk Breakdown
                    </h3>
                    <div className="space-y-6 mb-10">
                      {[
                        { label: "Contract Safety",     value: analysis.contractVerified ? (analysis.isHoneypot ? 20 : 85) : 20,  color: analysis.contractVerified && !analysis.isHoneypot ? "#16A34A" : "#DC2626" },
                        { label: "Ownership Security",  value: analysis.ownershipRenounced ? 92 : Math.min(analysis.devWalletPercent, 80), color: analysis.ownershipRenounced ? "#16A34A" : analysis.devWalletPercent > 20 ? "#DC2626" : "#F5B942" },
                        { label: "Liquidity Stability", value: analysis.liquidityUSD > 100000 ? Math.min(Math.round(analysis.liquidityUSD / 500000), 92) : (analysis.liquidityUSD > 0 ? 30 : 5), color: analysis.liquidityUSD > 100000 ? "#16A34A" : analysis.liquidityUSD > 0 ? "#F5B942" : "#DC2626" },
                        { label: "Holder Distribution", value: Math.max(100 - analysis.top10Percent, 10), color: analysis.top10Percent > 60 ? "#DC2626" : analysis.top10Percent > 30 ? "#F5B942" : "#16A34A" },
                        { label: "Tax Structure",       value: analysis.sellTax > 15 ? 5 : analysis.sellTax > 5 ? 55 : analysis.sellTax > 0 ? 85 : 95, color: analysis.sellTax > 15 ? "#DC2626" : analysis.sellTax > 5 ? "#F5B942" : "#16A34A" },
                      ].map((bar) => (
                        <RiskBar key={bar.label} label={bar.label} value={bar.value} color={bar.color} />
                      ))}
                    </div>

                    {/* Risk flags */}
                    <div className="space-y-4">
                      {analysis.risks.map((r) => (
                        <div
                          key={r.label}
                          className="flex items-start gap-5 p-5 rounded-xl"
                          style={{
                            background: r.severity === "high" ? "rgba(239,68,68,0.08)" : r.severity === "medium" ? "rgba(245,185,66,0.08)" : "rgba(24,195,126,0.08)",
                            border: `1px solid ${r.severity === "high" ? "rgba(239,68,68,0.18)" : r.severity === "medium" ? "rgba(245,185,66,0.18)" : "rgba(24,195,126,0.18)"}`,
                          }}
                        >
                          <span style={{ fontSize: "1.2rem", flexShrink: 0, marginTop: "2px" }}>
                            {r.severity === "high" ? "🚨" : r.severity === "medium" ? "⚠️" : "ℹ️"}
                          </span>
                          <div>
                            <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "1rem", marginBottom: "0.4rem" }}>{r.label}</p>
                            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{r.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Holder Distribution & Swap */}
                  <div className="grid xl:grid-cols-2 gap-[32px]">
                    <div className="wb-card p-8 rounded-2xl enterprise-card">
                      <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.2rem" }}>
                        Holder Distribution
                      </h3>
                      <HolderDonut holders={analysis.holders} />
                    </div>
                    <SwapPreview token={analysis} />
                  </div>
                </>
              ) : (
                <div className="wb-card p-10 h-full flex flex-col justify-center rounded-2xl enterprise-card">
                  <h3 className="mb-6" style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.6rem", fontWeight: 500, color: "var(--wb-color-text-primary)" }}>
                    Enterprise-Grade Security Checks
                  </h3>
                  <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.05rem", marginBottom: "3rem", maxWidth: "600px", lineHeight: 1.6 }}>
                    WaveBlock performs comprehensive, AI-driven checks on token contracts to ensure your investments are safe.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-x-10 gap-y-12">
                    {/* Check 1 */}
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-xl" style={{ background: "rgba(79,124,255,0.1)", color: "var(--wb-color-primary)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </div>
                      <div>
                        <h4 style={{ color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "1.05rem", marginBottom: "0.5rem" }}>Smart Contract Audit</h4>
                        <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>Deep analysis of bytecode to detect honeypots, hidden mint functions, and malicious backdoors.</p>
                      </div>
                    </div>

                    {/* Check 2 */}
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-xl" style={{ background: "rgba(24,195,126,0.1)", color: "var(--wb-color-success)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <div>
                        <h4 style={{ color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "1.05rem", marginBottom: "0.5rem" }}>Ownership Analysis</h4>
                        <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>Verifies if contract ownership is renounced and flags suspicious developer wallet balances.</p>
                      </div>
                    </div>

                    {/* Check 3 */}
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-xl" style={{ background: "rgba(245,185,66,0.1)", color: "#F5B942" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                      <div>
                        <h4 style={{ color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "1.05rem", marginBottom: "0.5rem" }}>Liquidity Tracking</h4>
                        <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>Monitors DEX liquidity pools and checks if LP tokens are securely locked or burned.</p>
                      </div>
                    </div>

                    {/* Check 4 */}
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", color: "var(--wb-color-danger)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l2-9 5 18 3-10 4 2h4"/></svg>
                      </div>
                      <div>
                        <h4 style={{ color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "1.05rem", marginBottom: "0.5rem" }}>Tax Structure</h4>
                        <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>Simulates buy/sell transactions to reveal hidden taxes and dynamic fee manipulation.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Enterprise Card Global Overrides */}
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
