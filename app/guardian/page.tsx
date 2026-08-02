"use client";
import { useState, useCallback } from "react";
import BlockchainCanvas from "@/components/BlockchainCanvas";

interface GuardianResponse {
  riskLevel: "SAFE" | "CAUTION" | "HIGH_RISK";
  warnings: string[];
  gasEstimate: string | null;
  aiRecommendation: string;
  details: {
    functionSelector: string;
    approvalTarget: string | null;
    approvalUnlimited: boolean;
    approvalAmount: string | null;
    tokenTransfer: { to: string; amount: string } | null;
  };
  error?: string;
}

function Skeleton({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`skeleton ${h} ${w} rounded-lg`} />;
}

const RISK_STYLES: Record<string, { bg: string; fg: string; border: string; label: string }> = {
  SAFE: { bg: "rgba(16,185,129,0.1)", fg: "#059669", border: "rgba(16,185,129,0.25)", label: "SAFE" },
  CAUTION: { bg: "rgba(245,158,11,0.1)", fg: "#D97706", border: "rgba(245,158,11,0.25)", label: "CAUTION" },
  HIGH_RISK: { bg: "rgba(239,68,68,0.1)", fg: "#DC2626", border: "rgba(239,68,68,0.25)", label: "HIGH RISK" },
};

export default function GuardianPage() {
  const [to, setTo] = useState("");
  const [data, setData] = useState("");
  const [from, setFrom] = useState("");
  const [value, setValue] = useState("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GuardianResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkTx = useCallback(async () => {
    if (!to.trim() || !data.trim() || !from.trim()) {
      setError("To, Data and From fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/guardian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, data, from, value: value || "0" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Guardian check failed");
        setLoading(false);
        return;
      }
      setResult(json);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }, [to, data, from, value]);

  const risk = result ? RISK_STYLES[result.riskLevel] : null;

  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-surface)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div className="wb-container py-[72px]">
          <div className="mb-8">
            <h1 style={{ fontFamily: "var(--wb-font-serif)", fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 400, color: "var(--wb-text)", marginBottom: "0.5rem" }}>
              Transaction Guardian
            </h1>
            <p style={{ color: "var(--wb-text-secondary)", fontSize: "0.9375rem" }}>
              Paste a raw transaction to decode it, detect dangerous function calls, flag unlimited approvals, and get an AI recommendation before you sign.
            </p>
          </div>

          <div className="wb-card p-6 mb-8">
            <div className="space-y-4">
              <div>
                <label style={{ display: "block", color: "#475569", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.375rem" }}>To (contract)</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x..."
                  className="wb-input w-full"
                  style={{ padding: "0.75rem 1rem", border: "1.5px solid var(--wb-color-border-strong)", borderRadius: "var(--wb-radius-md)", fontFamily: "var(--wb-font-mono)", fontSize: "0.85rem", background: "var(--wb-color-surface)", outline: "none", color: "var(--wb-color-text-primary)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#475569", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.375rem" }}>From (your wallet)</label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="0x..."
                  className="wb-input w-full"
                  style={{ padding: "0.75rem 1rem", border: "1.5px solid var(--wb-color-border-strong)", borderRadius: "var(--wb-radius-md)", fontFamily: "var(--wb-font-mono)", fontSize: "0.85rem", background: "var(--wb-color-surface)", outline: "none", color: "var(--wb-color-text-primary)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#475569", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.375rem" }}>Call data (hex)</label>
                <textarea
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder="0x095ea7b3..."
                  rows={4}
                  className="wb-input w-full"
                  style={{ padding: "0.75rem 1rem", border: "1.5px solid var(--wb-color-border-strong)", borderRadius: "var(--wb-radius-md)", fontFamily: "var(--wb-font-mono)", fontSize: "0.85rem", background: "var(--wb-color-surface)", outline: "none", color: "var(--wb-color-text-primary)", resize: "vertical" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#475569", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.375rem" }}>Value (ETH, optional)</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                  className="wb-input w-full"
                  style={{ padding: "0.75rem 1rem", border: "1.5px solid var(--wb-color-border-strong)", borderRadius: "var(--wb-radius-md)", fontFamily: "var(--wb-font-mono)", fontSize: "0.85rem", background: "var(--wb-color-surface)", outline: "none", color: "var(--wb-color-text-primary)" }}
                />
              </div>
              <button
                onClick={checkTx}
                disabled={loading}
                style={{
                  background: loading ? "var(--wb-color-text-disabled)" : "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))",
                  color: "#fff", border: "none", borderRadius: "var(--wb-radius-md)",
                  padding: "0.875rem 2rem", fontWeight: 700, fontSize: "0.9375rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "var(--wb-shadow-button-hover)",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}
              >
                {loading ? (
                  <>
                    <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Analysing…
                  </>
                ) : (
                  "Check Transaction"
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="wb-card p-4 mb-8" style={{ border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.07)" }}>
              <p style={{ color: "var(--wb-color-danger)", fontSize: "0.875rem", fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {loading && (
            <div className="wb-card p-6 space-y-3 animate-pulse">
              <Skeleton h="h-8" w="w-40" />
              <Skeleton h="h-20" />
              <Skeleton h="h-16" />
            </div>
          )}

          {result && !loading && risk && (
            <div className="wb-card p-6 mb-8" style={{ border: `1px solid ${risk.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1.1rem" }}>
                    Transaction Verdict
                  </h3>
                  <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--wb-font-mono)" }}>
                    selector: {result.details.functionSelector || "—"}
                  </p>
                </div>
                <span className="px-4 py-2 rounded-full text-sm font-bold" style={{ background: risk.bg, color: risk.fg, border: `1px solid ${risk.border}` }}>
                  {risk.label}
                </span>
              </div>

              {result.gasEstimate && (
                <div className="mb-4 rounded-lg p-3" style={{ background: "var(--wb-color-surface)", border: "1px solid var(--wb-color-border)" }}>
                  <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.7rem", marginBottom: "0.25rem" }}>Gas Estimate</p>
                  <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--wb-font-mono)" }}>{parseInt(result.gasEstimate).toLocaleString()} gas</p>
                </div>
              )}

              {result.details.approvalTarget && (
                <div className="mb-4 rounded-lg p-3" style={{ background: result.details.approvalUnlimited ? "rgba(239,68,68,0.08)" : "rgba(245,185,66,0.08)", border: `1px solid ${result.details.approvalUnlimited ? "rgba(239,68,68,0.18)" : "rgba(245,185,66,0.18)"}` }}>
                  <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.7rem", marginBottom: "0.25rem" }}>Approval Target</p>
                  <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--wb-font-mono)" }}>{result.details.approvalTarget}</p>
                  {result.details.approvalUnlimited && (
                    <p style={{ color: "var(--wb-color-danger)", fontSize: "0.8rem", fontWeight: 600, marginTop: "0.25rem" }}>⚠️ Unlimited approval</p>
                  )}
                </div>
              )}

              <div className="mb-4">
                <h4 style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem" }}>Warnings</h4>
                {result.warnings.length === 0 ? (
                  <p style={{ color: "var(--wb-color-success)", fontSize: "0.85rem" }}>No warnings detected.</p>
                ) : (
                  <div className="space-y-2">
                    {result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(245,185,66,0.08)", border: "1px solid rgba(245,185,66,0.18)" }}>
                        <span>⚠️</span>
                        <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.85rem" }}>{w}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--wb-color-primary-soft)", border: "1px solid rgba(79,124,255,0.18)" }}>
                <h4 style={{ color: "var(--wb-color-primary)", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.375rem" }}>AI Recommendation</h4>
                <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{result.aiRecommendation}</p>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--wb-color-primary-soft)", border: "1px solid rgba(79,124,255,0.15)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--wb-color-primary)" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.5rem", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "0.75rem" }}>
                Simulate before you sign
              </h2>
              <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.9375rem", maxWidth: "36rem", margin: "0 auto" }}>
                Enter transaction details above. The Guardian decodes the calldata, detects dangerous selectors, estimates gas, and returns an AI verdict.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
