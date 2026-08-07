"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import BlockchainCanvas from "@/components/BlockchainCanvas";

/* ─── Types ──────────────────────────────────────────────────── */
interface NavItem {
  id: string;
  label: string;
  icon: string;
  children?: { id: string; label: string }[];
}

interface TocEntry { id: string; label: string; level: 1 | 2 }

/* ─── Nav Structure ──────────────────────────────────────────── */
const NAV: NavItem[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "🚀",
    children: [
      { id: "getting-started", label: "Overview" },
      { id: "quickstart", label: "Quickstart" },
    ],
  },
  {
    id: "token-analysis",
    label: "Token Analysis",
    icon: "🛡️",
    children: [
      { id: "trust-score", label: "Trust Score" },
      { id: "contract-analysis", label: "Contract Analysis" },
      { id: "liquidity", label: "Liquidity & Honeypot" },
    ],
  },
  {
    id: "ai-copilot",
    label: "AI Copilot",
    icon: "🤖",
    children: [{ id: "ai-copilot", label: "Using the Copilot" }],
  },
  {
    id: "portfolio-guardian",
    label: "Portfolio Guardian",
    icon: "📊",
    children: [{ id: "portfolio-guardian", label: "Portfolio Scanning" }],
  },
  {
    id: "api",
    label: "API Reference",
    icon: "⚡",
    children: [
      { id: "api", label: "Overview" },
      { id: "api-analyze", label: "POST /api/analyze" },
      { id: "api-portfolio", label: "POST /api/portfolio" },
    ],
  },
  { id: "faq", label: "FAQ", icon: "❓" },
  { id: "changelog", label: "Changelog", icon: "📋" },
];

/* ─── Flat section lookup ────────────────────────────────────── */
const ALL_SECTIONS = NAV.flatMap((n) => n.children ? n.children : [{ id: n.id, label: n.label }]);

/* ─── Page data ──────────────────────────────────────────────── */
interface PageData {
  title: string;
  subtitle: string;
  readingTime: number;
  breadcrumb: string[];
  toc: TocEntry[];
  render: () => React.ReactNode;
}

/* ─── Callout ────────────────────────────────────────────────── */
function Callout({ type, children }: { type: "info" | "warning" | "success" | "danger"; children: React.ReactNode }) {
  const cfg = {
    info:    { icon: "ℹ️", bg: "rgba(82,102,235,0.08)", border: "rgba(82,102,235,0.25)", color: "#7B8FFF" },
    warning: { icon: "⚠️", bg: "rgba(245,185,66,0.08)", border: "rgba(245,185,66,0.25)", color: "#F5B942" },
    success: { icon: "✅", bg: "rgba(24,195,126,0.08)", border: "rgba(24,195,126,0.25)", color: "#18C37E" },
    danger:  { icon: "🚨", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  color: "#EF4444" },
  }[type];
  return (
    <div className="flex gap-4 my-6 p-5 rounded-2xl" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span style={{ fontSize: "1.15rem", flexShrink: 0, marginTop: "2px" }}>{cfg.icon}</span>
      <div style={{ color: "var(--wb-color-text-secondary)", lineHeight: 1.7, fontSize: "0.975rem" }}>{children}</div>
    </div>
  );
}

/* ─── Code Block ────────────────────────────────────────────── */
function CodeBlock({ lang, code }: { lang?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-6 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--wb-font-mono)", fontWeight: 500 }}>{lang ?? "code"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all"
          style={{ background: copied ? "rgba(24,195,126,0.15)" : "rgba(255,255,255,0.05)", color: copied ? "#18C37E" : "var(--wb-color-text-muted)", border: `1px solid ${copied ? "rgba(24,195,126,0.3)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer" }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ padding: "1.5rem", fontFamily: "var(--wb-font-mono)", fontSize: "0.875rem", lineHeight: 1.7, overflowX: "auto", background: "rgba(0,0,0,0.25)", margin: 0, color: "var(--wb-color-text-primary)" }}>
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

/* ─── Doc heading helpers ────────────────────────────────────── */
const H2 = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h2 id={id} style={{ fontFamily: "var(--wb-font-ui)", fontSize: "1.35rem", fontWeight: 700, color: "var(--wb-color-text-primary)", marginTop: "3rem", marginBottom: "1rem", paddingTop: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
    {children}
  </h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "1.1rem", fontWeight: 600, color: "var(--wb-color-text-primary)", marginTop: "1.75rem", marginBottom: "0.75rem" }}>{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "var(--wb-color-text-secondary)", lineHeight: 1.8, fontSize: "1rem", marginBottom: "1.25rem" }}>{children}</p>
);
const Ul = ({ items }: { items: string[] }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3" style={{ color: "var(--wb-color-text-secondary)", lineHeight: 1.7, fontSize: "0.975rem" }}>
        <span style={{ color: "var(--wb-color-primary)", flexShrink: 0, marginTop: "3px" }}>→</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

function ScoreTable() {
  const rows = [
    { range: "80 – 100", label: "Low Risk", badge: "Safe", color: "#18C37E", bg: "rgba(24,195,126,0.1)" },
    { range: "60 – 79", label: "Medium Risk", badge: "Caution", color: "#F5B942", bg: "rgba(245,185,66,0.1)" },
    { range: "40 – 59", label: "High Risk", badge: "Risky", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    { range: "0 – 39", label: "Critical Risk", badge: "Do Not Interact", color: "#B91C1C", bg: "rgba(185,28,28,0.15)" },
  ];
  return (
    <div className="my-6 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "rgba(0,0,0,0.25)" }}>
            {["Score Range", "Risk Level", "Status"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "12px 20px", color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.range} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <td style={{ padding: "12px 20px", fontFamily: "var(--wb-font-mono)", fontSize: "0.9rem", color: "var(--wb-color-text-primary)" }}>{r.range}</td>
              <td style={{ padding: "12px 20px", color: "var(--wb-color-text-secondary)", fontSize: "0.9rem" }}>{r.label}</td>
              <td style={{ padding: "12px 20px" }}>
                <span style={{ background: r.bg, color: r.color, border: `1px solid ${r.color}30`, padding: "3px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600 }}>{r.badge}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Page Definitions ───────────────────────────────────────── */
const PAGES: Record<string, PageData> = {
  "getting-started": {
    title: "Getting Started with WaveBlock",
    subtitle: "Everything you need to begin using the platform in under 5 minutes.",
    readingTime: 3,
    breadcrumb: ["Getting Started", "Overview"],
    toc: [
      { id: "overview", label: "Overview", level: 1 },
      { id: "no-account", label: "No Account Required", level: 2 },
      { id: "connect-wallet", label: "Connecting Your Wallet", level: 2 },
    ],
    render: () => (
      <>
        <Callout type="success">WaveBlock requires no account creation or sign-up. You can analyse tokens immediately.</Callout>
        <H2 id="overview">Overview</H2>
        <P>WaveBlock is a read-only on-chain security platform for Ethereum ERC-20 tokens. It helps traders, investors, and developers evaluate token safety before interacting with a contract.</P>
        <H2 id="no-account">No Account Required</H2>
        <P>Simply navigate to the <strong style={{ color: "var(--wb-color-text-primary)" }}>Dashboard</strong> and paste any ERC-20 token contract address to receive a full AI Trust Report — no email, no sign-up, no KYC.</P>
        <H3>What you get instantly:</H3>
        <Ul items={[
          "AI-generated Trust Score (0–100) with composite risk breakdown",
          "Contract verification status, ownership, and proxy detection",
          "Honeypot simulation and sell-tax analysis",
          "Liquidity pool depth and LP lock status",
          "Top holder distribution with whale concentration alerts",
          "Full AI narrative security report",
        ]} />
        <H2 id="connect-wallet">Connecting Your Wallet</H2>
        <P>Wallet connection is optional and used only for Sign-In With Ethereum (SIWE) authentication and portfolio scanning. WaveBlock is read-only — it never requests transaction signing or fund movement.</P>
        <Callout type="info">WaveBlock supports MetaMask and any EIP-1193-compliant wallet. Multi-wallet environments (Rabby, Coinbase Wallet) are detected automatically.</Callout>
        <P>To connect, click <strong style={{ color: "var(--wb-color-text-primary)" }}>Connect Wallet</strong> in the top navigation bar. Your wallet address is stored locally and never sent to WaveBlock servers.</P>
      </>
    ),
  },
  "quickstart": {
    title: "Quickstart",
    subtitle: "Analyse your first token in 30 seconds.",
    readingTime: 2,
    breadcrumb: ["Getting Started", "Quickstart"],
    toc: [
      { id: "step-1", label: "Step 1 — Find a Contract", level: 1 },
      { id: "step-2", label: "Step 2 — Paste & Analyse", level: 1 },
      { id: "step-3", label: "Step 3 — Read the Report", level: 1 },
    ],
    render: () => (
      <>
        <Callout type="info">You can paste a contract address directly from Etherscan, Uniswap, or any DEX listing page.</Callout>
        <H2 id="step-1">Step 1 — Find a Contract Address</H2>
        <P>Every ERC-20 token on Ethereum has a unique contract address starting with <code style={{ fontFamily: "var(--wb-font-mono)", fontSize: "0.9em", background: "rgba(82,102,235,0.15)", color: "var(--wb-color-primary)", padding: "2px 8px", borderRadius: "6px" }}>0x</code>. You can find it on Etherscan, CoinGecko, or the token project's website.</P>
        <H2 id="step-2">Step 2 — Paste & Analyse</H2>
        <P>Go to the Dashboard, paste the address into the search field, and click <strong style={{ color: "var(--wb-color-text-primary)" }}>Analyse Token</strong>. The analysis typically completes in 3–8 seconds.</P>
        <CodeBlock lang="example address" code="0x6982508145454Ce325dDbE47a25d4ec3d2311933" />
        <H2 id="step-3">Step 3 — Read the Report</H2>
        <P>The AI Trust Report includes a top-line Trust Score, a risk breakdown across five dimensions, contract analysis flags, and a full narrative written by the AI Copilot. Use this to make an informed decision before interacting with any token.</P>
        <Callout type="warning">WaveBlock analysis is a security tool, not financial advice. Always conduct your own research before investing.</Callout>
      </>
    ),
  },
  "trust-score": {
    title: "Understanding Trust Scores",
    subtitle: "A composite 0–100 rating calculated across five weighted security dimensions.",
    readingTime: 5,
    breadcrumb: ["Token Analysis", "Trust Score"],
    toc: [
      { id: "how-calculated", label: "How It's Calculated", level: 1 },
      { id: "dimensions", label: "The Five Dimensions", level: 1 },
      { id: "score-ranges", label: "Score Ranges", level: 1 },
    ],
    render: () => (
      <>
        <H2 id="how-calculated">How the Trust Score is Calculated</H2>
        <P>The Trust Score is a weighted composite of five security dimensions evaluated from on-chain data. Each dimension contributes a percentage of the final score, and the result is normalised to a 0–100 scale.</P>
        <H2 id="dimensions">The Five Dimensions</H2>
        <Ul items={[
          "Contract Safety (25%) — source code verification, hidden function detection, proxy patterns",
          "Ownership Security (25%) — renouncement status, multisig, team wallet concentration",
          "Liquidity Stability (20%) — pool depth, lock duration, LP token distribution",
          "Holder Distribution (15%) — Gini coefficient, whale concentration, insider wallets",
          "Tax Structure (15%) — buy/sell tax rates, honeypot simulation result",
        ]} />
        <Callout type="info">A single critical flag (e.g. honeypot detected) will override the composite score and force the result to Critical Risk regardless of other factors.</Callout>
        <H2 id="score-ranges">Score Ranges</H2>
        <P>Use the following table to interpret a Trust Score result:</P>
        <ScoreTable />
      </>
    ),
  },
  "contract-analysis": {
    title: "Contract Analysis",
    subtitle: "How WaveBlock inspects ERC-20 smart contracts for hidden risks.",
    readingTime: 5,
    breadcrumb: ["Token Analysis", "Contract Analysis"],
    toc: [
      { id: "verification", label: "Verification Status", level: 1 },
      { id: "ownership", label: "Ownership", level: 1 },
      { id: "hidden-functions", label: "Hidden Functions", level: 1 },
      { id: "proxy", label: "Proxy Detection", level: 1 },
    ],
    render: () => (
      <>
        <H2 id="verification">Verification Status</H2>
        <P>WaveBlock checks whether the contract source code is verified on Etherscan. Unverified contracts cannot be fully audited and should be treated as high risk.</P>
        <Callout type="danger">An unverified contract immediately adds significant negative weight to the Trust Score. Never interact with unverified token contracts without extreme caution.</Callout>
        <H2 id="ownership">Ownership</H2>
        <P>Detects whether the contract owner has been set to the zero address (renounced). An active owner can modify taxes, pause transfers, or drain liquidity. WaveBlock also reports the owner wallet balance as a percentage of total supply.</P>
        <H2 id="hidden-functions">Hidden Functions</H2>
        <P>WaveBlock scans bytecode for common rug-pull patterns, including:</P>
        <Ul items={[
          "Hidden mint functions that allow unlimited token creation",
          "Sell blockers that prevent non-whitelisted wallets from selling",
          "Emergency withdrawal backdoors targeting liquidity pools",
          "Fee-on-transfer modifications disguised as utility functions",
        ]} />
        <H2 id="proxy">Proxy Detection</H2>
        <P>Upgradeable proxy patterns (EIP-1967, OpenZeppelin Transparent Proxy) allow contract logic to be swapped post-deployment. WaveBlock flags these contracts as they can be exploited to modify behaviour after launch.</P>
      </>
    ),
  },
  "liquidity": {
    title: "Liquidity & Honeypot Detection",
    subtitle: "Measuring pool health, LP locks, and simulating sell transactions.",
    readingTime: 4,
    breadcrumb: ["Token Analysis", "Liquidity & Honeypot"],
    toc: [
      { id: "liquidity-analysis", label: "Liquidity Analysis", level: 1 },
      { id: "honeypot", label: "Honeypot Detection", level: 1 },
      { id: "lp-locks", label: "LP Lock Verification", level: 1 },
    ],
    render: () => (
      <>
        <H2 id="liquidity-analysis">Liquidity Analysis</H2>
        <P>WaveBlock measures total liquidity pool depth in USD from the primary Uniswap V2/V3 pair. A low liquidity pool (&lt; $10,000) means a small sell order can crash the token price.</P>
        <H2 id="honeypot">Honeypot Detection</H2>
        <P>A transaction simulation is run against the contract to test whether sell transactions succeed or fail for non-whitelisted addresses. Honeypots are flagged with a Critical Risk rating regardless of all other factors.</P>
        <Callout type="danger">If a token is flagged as a Honeypot, do not buy it. You will be unable to sell and will lose your entire investment.</Callout>
        <H2 id="lp-locks">LP Lock Verification</H2>
        <P>WaveBlock checks lock contracts from the following providers:</P>
        <Ul items={["Unicrypt", "Team.Finance", "Pinksale", "DxLock"]} />
        <P>A locked pool shows the expiry date and percentage of total LP tokens locked. Unlocked or expired locks are flagged as a risk.</P>
      </>
    ),
  },
  "ai-copilot": {
    title: "AI Security Copilot",
    subtitle: "Your on-chain security assistant powered by Gemini.",
    readingTime: 3,
    breadcrumb: ["AI Copilot", "Using the Copilot"],
    toc: [
      { id: "what-it-does", label: "What It Does", level: 1 },
      { id: "capabilities", label: "Capabilities", level: 1 },
      { id: "limitations", label: "Limitations", level: 1 },
    ],
    render: () => (
      <>
        <H2 id="what-it-does">What It Does</H2>
        <P>The AI Copilot is a security-focused language model assistant that understands WaveBlock token analysis data. It can explain risk flags, compare tokens, and answer plain-English questions about smart contract safety.</P>
        <H2 id="capabilities">Capabilities</H2>
        <Ul items={[
          "Explain why a token received a specific Trust Score",
          "Clarify what each risk flag (Honeypot, Unverified, etc.) means in practice",
          "Compare two tokens side-by-side using their security data",
          "Provide beginner-friendly explanations of DeFi concepts",
          "Answer general questions about smart contract security",
        ]} />
        <Callout type="warning">The Copilot is a security education tool. It does not provide financial advice, price predictions, or trading signals.</Callout>
        <H2 id="limitations">Limitations</H2>
        <Ul items={[
          "The Copilot cannot access real-time blockchain data independently — it uses the most recent analysis result",
          "It does not have access to private or off-chain data",
          "Responses may occasionally contain inaccuracies — always verify on-chain",
        ]} />
      </>
    ),
  },
  "portfolio-guardian": {
    title: "Portfolio Guardian",
    subtitle: "Scan an entire wallet to evaluate every holding's security risk.",
    readingTime: 3,
    breadcrumb: ["Portfolio Guardian", "Portfolio Scanning"],
    toc: [
      { id: "how-it-works", label: "How It Works", level: 1 },
      { id: "health-score", label: "Portfolio Health Score", level: 1 },
    ],
    render: () => (
      <>
        <H2 id="how-it-works">How It Works</H2>
        <P>Enter any Ethereum wallet address in the Portfolio Guardian page. WaveBlock fetches all ERC-20 holdings via the Etherscan token transfers API, evaluates each token's security profile, and produces an aggregated portfolio report.</P>
        <Callout type="info">Portfolio Guardian only reads publicly available on-chain data. It does not require wallet connection or signing.</Callout>
        <H2 id="health-score">Portfolio Health Score</H2>
        <P>The Portfolio Health Score is a 0–100 aggregate derived from:</P>
        <Ul items={[
          "Weighted average Trust Score of all holdings",
          "Number of high-risk or critical assets detected",
          "Whale concentration and diversification index",
          "Presence of suspicious or honeypot assets",
        ]} />
      </>
    ),
  },
  "api": {
    title: "API Reference",
    subtitle: "Programmatic access to WaveBlock's security engine.",
    readingTime: 4,
    breadcrumb: ["API Reference", "Overview"],
    toc: [
      { id: "base-url", label: "Base URL", level: 1 },
      { id: "auth", label: "Authentication", level: 1 },
      { id: "rate-limits", label: "Rate Limits", level: 1 },
    ],
    render: () => (
      <>
        <Callout type="info">The WaveBlock REST API is currently in developer preview. Enterprise API access with dedicated rate limits is coming in Q3 2025.</Callout>
        <H2 id="base-url">Base URL</H2>
        <CodeBlock lang="url" code="https://waveblock.io/api" />
        <H2 id="auth">Authentication</H2>
        <P>Public endpoints do not require authentication. Enterprise endpoints require a Bearer token in the Authorization header.</P>
        <CodeBlock lang="http" code={`Authorization: Bearer YOUR_API_KEY`} />
        <H2 id="rate-limits">Rate Limits</H2>
        <Ul items={[
          "Free tier: 10 requests per minute",
          "Enterprise: 1,000 requests per minute",
          "Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining",
        ]} />
      </>
    ),
  },
  "api-analyze": {
    title: "POST /api/analyze",
    subtitle: "Analyse a token contract address and receive a full security report.",
    readingTime: 4,
    breadcrumb: ["API Reference", "POST /api/analyze"],
    toc: [
      { id: "request", label: "Request", level: 1 },
      { id: "response", label: "Response", level: 1 },
      { id: "errors", label: "Errors", level: 1 },
    ],
    render: () => (
      <>
        <H2 id="request">Request</H2>
        <CodeBlock lang="json — request body" code={`{
  "address": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
  "chain": "ethereum"
}`} />
        <H2 id="response">Response</H2>
        <CodeBlock lang="json — response" code={`{
  "trustScore": 82,
  "riskLevel": "Low",
  "name": "Pepe",
  "symbol": "PEPE",
  "contractVerified": true,
  "ownershipRenounced": true,
  "liquidityLocked": true,
  "isHoneypot": false,
  "buyTax": 0,
  "sellTax": 0,
  "liquidityUSD": 4200000,
  "holderCount": 187400,
  "aiReport": "PEPE is a meme token...",
  "holders": [
    { "label": "Top Wallet", "pct": 12, "color": "#5266EB" }
  ],
  "risks": []
}`} />
        <H2 id="errors">Errors</H2>
        <Ul items={[
          "400 Bad Request — missing or invalid contract address",
          "429 Too Many Requests — rate limit exceeded",
          "500 Internal Server Error — upstream data provider unavailable",
        ]} />
      </>
    ),
  },
  "api-portfolio": {
    title: "POST /api/portfolio",
    subtitle: "Scan a wallet address and evaluate all ERC-20 holdings.",
    readingTime: 3,
    breadcrumb: ["API Reference", "POST /api/portfolio"],
    toc: [
      { id: "request", label: "Request", level: 1 },
      { id: "response", label: "Response", level: 1 },
    ],
    render: () => (
      <>
        <H2 id="request">Request</H2>
        <CodeBlock lang="json — request body" code={`{
  "address": "0x28C6c06298d514Db089934071355E5743bf21d60"
}`} />
        <H2 id="response">Response</H2>
        <CodeBlock lang="json — response" code={`{
  "portfolioHealthScore": 74,
  "totalTokens": 12,
  "totalValueUsd": 48200,
  "overallRiskScore": 31,
  "highRiskHoldings": 2,
  "diversificationScore": 67,
  "largestPositions": [...],
  "suspiciousAssets": [...],
  "holdings": [...],
  "aiSummary": "This portfolio..."
}`} />
      </>
    ),
  },
  "faq": {
    title: "Frequently Asked Questions",
    subtitle: "Common questions about WaveBlock's platform, security, and roadmap.",
    readingTime: 5,
    breadcrumb: ["FAQ"],
    toc: [
      { id: "funds", label: "Does WaveBlock move funds?", level: 1 },
      { id: "chains", label: "Which chains are supported?", level: 1 },
      { id: "free", label: "Is WaveBlock free?", level: 1 },
      { id: "accuracy", label: "How accurate is the AI?", level: 1 },
    ],
    render: () => (
      <>
        <H2 id="funds">Does WaveBlock move my funds?</H2>
        <P>No. WaveBlock is entirely read-only. Wallet connection is optional and used only for Sign-In With Ethereum (SIWE) to authenticate your session. WaveBlock never requests transaction approval or fund movement of any kind.</P>
        <H2 id="chains">Which chains are supported?</H2>
        <P>Currently Ethereum Mainnet only. Planned network expansions include Polygon, Arbitrum, Base, and BNB Chain in Q3–Q4 2025.</P>
        <H2 id="free">Is WaveBlock free?</H2>
        <P>Yes — the core analysis platform is free with no rate limits on the web UI. Enterprise API access with dedicated infrastructure and SLA guarantees will be available in a paid tier.</P>
        <H2 id="accuracy">How accurate is the AI report?</H2>
        <P>On-chain data (contract verification, ownership, taxes) is deterministic and highly accurate. The AI narrative carries the same caveats as any automated analysis — it is a tool to inform decisions, not replace independent research.</P>
        <Callout type="warning">WaveBlock is a security tool, not financial advice. The Trust Score is not a guarantee of safety or returns.</Callout>
      </>
    ),
  },
  "changelog": {
    title: "Changelog",
    subtitle: "What's new in WaveBlock.",
    readingTime: 2,
    breadcrumb: ["Changelog"],
    toc: [{ id: "v1", label: "v1.0 — Initial Release", level: 1 }],
    render: () => (
      <>
        <div className="flex items-center gap-3 mb-2">
          <span style={{ background: "rgba(24,195,126,0.1)", color: "#18C37E", border: "1px solid rgba(24,195,126,0.25)", padding: "3px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600 }}>Latest</span>
          <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.9rem" }}>v1.0.0 — August 2025</span>
        </div>
        <H2 id="v1">v1.0 — Initial Platform Release</H2>
        <Ul items={[
          "Token Analysis Dashboard with AI Trust Score (0–100)",
          "Full contract analysis: verification, ownership, honeypot, taxes",
          "AI Trust Report powered by Google Gemini",
          "Holder distribution chart and Swap Preview",
          "Portfolio Guardian — full wallet security scan",
          "AI Security Copilot — chat interface for security questions",
          "Live Intelligence feed with real-time threat detection",
          "Sign-In With Ethereum (SIWE) authentication",
          "Three-panel documentation portal",
        ]} />
      </>
    ),
  },
};

/* ─── Main Component ─────────────────────────────────────────── */
export default function DocsPage() {
  const [activeId, setActiveId]         = useState("getting-started");
  const [search, setSearch]             = useState("");
  const [expandedGroups, setExpanded]   = useState<Set<string>>(new Set(["getting-started", "token-analysis"]));
  const [activeTocId, setActiveTocId]   = useState<string>("");
  const contentRef                      = useRef<HTMLDivElement>(null);

  const page = PAGES[activeId] ?? PAGES["getting-started"];

  const allSectionIdx = ALL_SECTIONS.findIndex((s) => s.id === activeId);
  const prevSection   = allSectionIdx > 0 ? ALL_SECTIONS[allSectionIdx - 1] : null;
  const nextSection   = allSectionIdx < ALL_SECTIONS.length - 1 ? ALL_SECTIONS[allSectionIdx + 1] : null;

  const filteredNav = search.trim()
    ? NAV.filter((g) => {
        const matchGroup = g.label.toLowerCase().includes(search.toLowerCase());
        const matchChild = g.children?.some((c) => c.label.toLowerCase().includes(search.toLowerCase()));
        return matchGroup || matchChild;
      })
    : NAV;

  const navigate = useCallback((id: string) => {
    setActiveId(id);
    setActiveTocId("");
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, []);

  const toggleGroup = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Highlight active TOC on scroll
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const handler = () => {
      const headings = container.querySelectorAll<HTMLElement>("h2[id]");
      let current = "";
      headings.forEach((h) => {
        if (h.offsetTop - 120 <= container.scrollTop) current = h.id;
      });
      setActiveTocId(current);
    };
    container.addEventListener("scroll", handler);
    return () => container.removeEventListener("scroll", handler);
  }, [activeId]);

  return (
    <div className="page-in relative" style={{ minHeight: "100vh" }}>
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* ── Docs Header ─────────────────────────────────────── */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(23,23,33,0.6)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", paddingTop: "var(--wb-navbar-height, 64px)" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>
            <p style={{ color: "var(--wb-color-primary)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Documentation</p>
            <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "10px", letterSpacing: "-0.02em" }}>
              WaveBlock Developer Docs
            </h1>
            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.05rem" }}>
              Everything you need to understand, use, and build on WaveBlock.
            </p>
          </div>
        </div>

        {/* ── Three-panel layout ─────────────────────────────── */}
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 40px",
            display: "grid",
            gridTemplateColumns: "280px 1fr 240px",
            gap: "0",
            minHeight: "calc(100vh - 160px)",
            alignItems: "start",
          }}
        >
          {/* ════════ LEFT SIDEBAR ════════ */}
          <aside
            style={{
              position: "sticky",
              top: "calc(var(--wb-navbar-height, 64px) + 160px)",
              height: "calc(100vh - var(--wb-navbar-height, 64px) - 160px)",
              overflowY: "auto",
              paddingTop: "32px",
              paddingRight: "24px",
              paddingBottom: "40px",
              borderRight: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Search */}
            <div className="relative mb-6">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search docs…"
                style={{
                  width: "100%", padding: "10px 14px 10px 38px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", color: "var(--wb-color-text-primary)", fontSize: "0.9rem",
                  outline: "none", fontFamily: "var(--wb-font-ui)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(82,102,235,0.5)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>

            {/* Nav groups */}
            <nav>
              {filteredNav.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                const isActive   = group.id === activeId || group.children?.some((c) => c.id === activeId);
                return (
                  <div key={group.id} className="mb-1">
                    <button
                      onClick={() => group.children ? toggleGroup(group.id) : navigate(group.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={{
                        background: isActive && !group.children ? "rgba(82,102,235,0.12)" : "transparent",
                        color: isActive ? "var(--wb-color-primary)" : "var(--wb-color-text-secondary)",
                        fontWeight: isActive ? 600 : 500,
                        border: "none", cursor: "pointer", fontSize: "0.9rem",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>{group.icon}</span>
                      <span style={{ flex: 1 }}>{group.label}</span>
                      {group.children && (
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          style={{ opacity: 0.5, transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      )}
                    </button>

                    {group.children && isExpanded && (
                      <div style={{ marginLeft: "32px", marginTop: "2px", marginBottom: "4px" }}>
                        {group.children
                          .filter((c) => !search || c.label.toLowerCase().includes(search.toLowerCase()))
                          .map((child) => {
                            const isChildActive = child.id === activeId;
                            return (
                              <button
                                key={child.id}
                                onClick={() => navigate(child.id)}
                                className="w-full text-left px-3 py-2 rounded-lg transition-all"
                                style={{
                                  background: isChildActive ? "rgba(82,102,235,0.12)" : "transparent",
                                  color: isChildActive ? "var(--wb-color-primary)" : "var(--wb-color-text-muted)",
                                  fontWeight: isChildActive ? 600 : 400,
                                  borderTop: "none",
                                  borderRight: "none",
                                  borderBottom: "none",
                                  borderLeft: isChildActive ? "2px solid var(--wb-color-primary)" : "2px solid transparent",
                                  cursor: "pointer", fontSize: "0.875rem",
                                  paddingLeft: "14px",
                                }}
                              >
                                {child.label}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* ════════ MAIN CONTENT ════════ */}
          <main
            ref={contentRef}
            style={{
              padding: "40px 56px",
              maxWidth: "100%",
              overflowY: "auto",
              height: "calc(100vh - var(--wb-navbar-height, 64px) - 160px)",
              scrollBehavior: "smooth",
            }}
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-8" style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem" }}>
              <span>Docs</span>
              {page.breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span style={{ opacity: 0.4 }}>/</span>
                  <span style={{ color: i === page.breadcrumb.length - 1 ? "var(--wb-color-text-primary)" : undefined }}>{crumb}</span>
                </span>
              ))}
            </div>

            {/* Page Title */}
            <div className="mb-10">
              <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(1.75rem,3vw,2.4rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "0.75rem", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {page.title}
              </h1>
              <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "680px" }}>{page.subtitle}</p>
              <div className="flex items-center gap-4 mt-5" style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem" }}>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  {page.readingTime} min read
                </span>
                <span style={{ opacity: 0.3 }}>•</span>
                <span>Last updated August 2025</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: "2.5rem" }} />

            {/* Page content */}
            <div style={{ maxWidth: "820px" }}>
              {page.render()}
            </div>

            {/* Prev / Next Navigation */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "4rem", paddingTop: "2rem", display: "flex", justifyContent: "space-between", gap: "16px" }}>
              {prevSection ? (
                <button
                  onClick={() => navigate(prevSection.id)}
                  className="flex flex-col gap-1 px-6 py-4 rounded-2xl transition-all"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", textAlign: "left", flex: 1, maxWidth: "340px" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(82,102,235,0.4)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>← Previous</span>
                  <span style={{ color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "0.95rem" }}>{prevSection.label}</span>
                </button>
              ) : <div />}

              {nextSection && (
                <button
                  onClick={() => navigate(nextSection.id)}
                  className="flex flex-col gap-1 px-6 py-4 rounded-2xl transition-all"
                  style={{ background: "rgba(82,102,235,0.05)", border: "1px solid rgba(82,102,235,0.2)", cursor: "pointer", textAlign: "right", flex: 1, maxWidth: "340px" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(82,102,235,0.5)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(82,102,235,0.2)"; }}
                >
                  <span style={{ color: "var(--wb-color-primary)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Next →</span>
                  <span style={{ color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "0.95rem" }}>{nextSection.label}</span>
                </button>
              )}
            </div>
          </main>

          {/* ════════ RIGHT SIDEBAR ════════ */}
          <aside
            style={{
              position: "sticky",
              top: "calc(var(--wb-navbar-height, 64px) + 160px)",
              height: "calc(100vh - var(--wb-navbar-height, 64px) - 160px)",
              overflowY: "auto",
              paddingTop: "32px",
              paddingLeft: "24px",
              paddingBottom: "40px",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* On This Page */}
            {page.toc.length > 0 && (
              <div className="mb-8">
                <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
                  On This Page
                </p>
                <nav className="space-y-1">
                  {page.toc.map((entry) => {
                    const isActiveToc = activeTocId === entry.id;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => {
                          const el = document.getElementById(entry.id);
                          if (el && contentRef.current) {
                            contentRef.current.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
                          }
                        }}
                        className="w-full text-left transition-all"
                        style={{
                          display: "block",
                          padding: `${entry.level === 2 ? "4px 8px 4px 16px" : "5px 8px"}`,
                          borderTop: "none",
                          borderRight: "none",
                          borderBottom: "none",
                          borderLeft: `2px solid ${isActiveToc ? "var(--wb-color-primary)" : "transparent"}`,
                          color: isActiveToc ? "var(--wb-color-primary)" : "var(--wb-color-text-muted)",
                          fontSize: entry.level === 2 ? "0.8rem" : "0.85rem",
                          fontWeight: isActiveToc ? 600 : 400,
                          background: "transparent",
                          cursor: "pointer",
                          transition: "color 0.15s, border-color 0.15s",
                        }}
                      >
                        {entry.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Reading time */}
            <div
              className="mb-6 p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--wb-color-primary)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Read Time</span>
              </div>
              <p style={{ color: "var(--wb-color-text-primary)", fontSize: "1rem", fontWeight: 600 }}>{page.readingTime} min</p>
            </div>

            {/* Quick links */}
            <div className="mb-6">
              <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Quick Links</p>
              {[
                { label: "Dashboard", href: "/dashboard" },
                { label: "AI Copilot", href: "/copilot" },
                { label: "Portfolio Guardian", href: "/portfolio" },
                { label: "Live Intelligence", href: "/intelligence" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 py-2 transition-all"
                  style={{ color: "var(--wb-color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--wb-color-primary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--wb-color-text-muted)"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M7 7h10v10" /></svg>
                  {link.label}
                </a>
              ))}
            </div>

            {/* Helpful resources */}
            <div
              className="p-4 rounded-xl"
              style={{ background: "rgba(82,102,235,0.06)", border: "1px solid rgba(82,102,235,0.18)" }}
            >
              <p style={{ color: "var(--wb-color-primary)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Resources</p>
              <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                Need help? Use the <strong style={{ color: "var(--wb-color-text-primary)" }}>AI Copilot</strong> to ask security questions about any token.
              </p>
              <a
                href="/copilot"
                className="mt-3 flex items-center gap-2 text-sm font-semibold transition-all"
                style={{ color: "var(--wb-color-primary)", textDecoration: "none" }}
              >
                Open AI Copilot →
              </a>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(82,102,235,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}
