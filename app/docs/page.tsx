"use client";
import { useState } from "react";
import BlockchainCanvas from "@/components/BlockchainCanvas";

const SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    content: `WaveBlock requires no account creation or sign-up. Simply navigate to the Dashboard and paste any ERC-20 token contract address to receive a full AI Trust Report.

For wallet features (portfolio tracking, persistent history), connect your MetaMask wallet using the "Connect Wallet" button in the top navigation or Dashboard header.`,
  },
  {
    id: "trust-score",
    title: "Understanding Trust Scores",
    icon: "🛡️",
    content: `The Trust Score is a 0–100 composite rating calculated from five weighted dimensions:

• Contract Safety (25%) — source code verification, hidden function detection, proxy patterns
• Ownership Security (25%) — renouncement status, multisig, team wallet concentration  
• Liquidity Stability (20%) — pool depth, lock duration, LP token distribution
• Holder Distribution (15%) — Gini coefficient, whale concentration, insider wallets
• Tax Structure (15%) — buy/sell tax rates, honeypot simulation result

Score Ranges:
  80–100 → Low Risk (Safe)
  60–79  → Medium Risk (Caution)
  40–59  → High Risk (Risky)
  0–39   → Critical Risk (Do Not Interact)`,
  },
  {
    id: "contract-analysis",
    title: "Contract Analysis",
    icon: "🔍",
    content: `WaveBlock analyses the following contract properties:

Verification Status
Checks whether the contract source code is verified on Etherscan. Unverified contracts cannot be fully audited and should be treated as high risk.

Ownership
Detects whether the contract owner has been set to the zero address (renounced). An active owner can modify taxes, pause transfers, or drain funds.

Hidden Functions
Scans bytecode for common rug-pull patterns including hidden mint functions, sell blockers, and emergency withdrawal backdoors.

Proxy Detection
Identifies upgradeable proxy patterns that allow contract logic to be swapped post-deployment.`,
  },
  {
    id: "liquidity",
    title: "Liquidity & Honeypot",
    icon: "💧",
    content: `Liquidity Analysis
WaveBlock measures total liquidity pool depth in USD, checks whether LP tokens are locked (and for how long), and estimates the price impact of large sells.

Honeypot Detection
A transaction simulation is run against the contract to test whether sell transactions succeed or fail for non-whitelisted addresses. Honeypots are flagged with a Critical Risk rating regardless of other factors.

Liquidity Lock Verification
WaveBlock checks lock contracts from Unicrypt, Team.Finance, and Pinksale. A locked pool shows the expiry date and percentage of LP locked.`,
  },
  {
    id: "api",
    title: "API Reference",
    icon: "⚡",
    content: `WaveBlock exposes a REST API for programmatic access (coming in the enterprise tier).

POST /api/analyze
Analyse a token contract address.

Request body:
{
  "address": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
  "chain": "ethereum"
}

Response:
{
  "trustScore": 82,
  "riskLevel": "Low",
  "contractVerified": true,
  "ownershipRenounced": true,
  "liquidityLocked": true,
  "isHoneypot": false,
  "aiReport": "...",
  "holders": [...]
}

Rate Limits: 10 requests/min (free tier), 1000 requests/min (enterprise)`,
  },
  {
    id: "faq",
    title: "FAQ",
    icon: "❓",
    content: `Does WaveBlock move my funds?
No. WaveBlock is a read-only platform. Wallet connection is optional and only used for Sign-In With Ethereum authentication.

Which chains are supported?
Ethereum Mainnet (MVP). Polygon, Arbitrum, and BSC are planned for Q2 2025.

Is WaveBlock free?
Yes — the analysis platform is free. Enterprise features (API access, team workspaces, PDF export) will be available in a paid tier.

How accurate is the AI report?
The AI report is generated from on-chain data which is deterministic and verifiable. The narrative analysis carries the same caveats as any automated analysis — it is a tool to inform decisions, not replace them.

What if a token doesn't show up?
Ensure you have the correct contract address for the Ethereum Mainnet. Tokens on other chains are not currently supported.`,
  },
];

export default function DocsPage() {
  const [active, setActive] = useState("getting-started");
  const section = SECTIONS.find((s) => s.id === active)!;

  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div
          className="py-12 text-center"
          style={{ borderBottom: "1px solid var(--wb-color-border)", background: "var(--wb-color-surface)", backdropFilter: "blur(16px)" }}
        >
          <div className="wb-container">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>Documentation</p>
            <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "1rem" }}>
              WaveBlock Docs
            </h1>
            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1rem" }}>
              Everything you need to understand and use WaveBlock effectively.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="wb-container py-[72px]">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Sidebar */}
            <aside className="md:w-64 flex-shrink-0">
              <div className="wb-card p-4 sticky top-20">
                <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--wb-tracking-wide)", marginBottom: "0.75rem" }}>
                  Contents
                </p>
                <nav className="space-y-1">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActive(s.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all"
                      style={{
                        background: active === s.id ? "var(--wb-color-primary-soft)" : "transparent",
                        color: active === s.id ? "var(--wb-color-primary)" : "var(--wb-color-text-secondary)",
                        fontWeight: active === s.id ? 600 : 400,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <span>{s.icon}</span>
                      {s.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <main className="flex-1 min-w-0">
              <div className="wb-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span style={{ fontSize: "1.75rem" }}>{section.icon}</span>
                  <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.75rem", fontWeight: 400, color: "var(--wb-color-text-primary)" }}>
                    {section.title}
                  </h2>
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "var(--wb-color-text-secondary)",
                    lineHeight: 1.8,
                    fontSize: "0.9375rem",
                    fontFamily: "var(--wb-font-ui)",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: section.content
                      .replace(/^(POST|GET|PUT|DELETE) (.+)$/gm, '<code style="background:var(--wb-color-primary-soft);color:var(--wb-color-primary);padding:0.2em 0.5em;border-radius:4px;font-size:0.875rem">$1 $2</code>')
                      .replace(/^({[\s\S]*?^})/gm, '<pre style="background:var(--wb-color-surface);border:1px solid var(--wb-color-border);border-radius:var(--wb-radius-md);padding:1rem;font-family:var(--wb-font-mono);font-size:0.85rem;overflow-x:auto;margin:1rem 0;color:var(--wb-color-text-primary)">$1</pre>')
                      .replace(/(Score Ranges:|Request body:|Response:|Rate Limits:|•[^\n]+|→[^\n]+)/g, '<strong style="color:var(--wb-color-text-primary)">$1</strong>'),
                  }}
                />
              </div>

              {/* Nav arrows */}
              <div className="flex justify-between mt-4">
                {SECTIONS.findIndex((s) => s.id === active) > 0 && (
                  <button
                    onClick={() => setActive(SECTIONS[SECTIONS.findIndex((s) => s.id === active) - 1].id)}
                    style={{ background: "var(--wb-color-primary-soft)", border: "1px solid rgba(79,124,255,0.22)", borderRadius: "var(--wb-radius-md)", padding: "0.6rem 1.25rem", color: "var(--wb-color-primary)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
                  >
                    ← Previous
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {SECTIONS.findIndex((s) => s.id === active) < SECTIONS.length - 1 && (
                  <button
                    onClick={() => setActive(SECTIONS[SECTIONS.findIndex((s) => s.id === active) + 1].id)}
                    style={{ background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))", border: "none", borderRadius: "var(--wb-radius-md)", padding: "0.6rem 1.25rem", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", boxShadow: "var(--wb-shadow-button-hover)" }}
                  >
                    Next →
                  </button>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
