"use client";
import dynamic from "next/dynamic";
import BlockchainCanvas from "@/components/BlockchainCanvas";

const AISecurityCopilot = dynamic(() => import("@/components/AISecurityCopilot"), {
  ssr: false,
  loading: () => null,
});

const CAPABILITIES = [
  { icon: "🛡️", title: "Token Safety Checks", desc: "Ask about honeypot risk, buy/sell taxes, liquidity and holder concentration for any analysed token." },
  { icon: "🔍", title: "Risk Explanations", desc: "Understand why a trust score is low and what the specific risk flags actually mean." },
  { icon: "🤔", title: "Beginner Explanations", desc: "Plain-English breakdowns of smart contracts, approvals, and rug-pull mechanics." },
  { icon: "⚖️", title: "Comparisons", desc: "Compare tokens side-by-side using their live security and market data." },
];

export default function CopilotPage() {
  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div className="wb-container py-[72px]">
          <div className="text-center mb-24">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))",
                boxShadow: "var(--wb-shadow-button-hover)",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
                <path d="M9 14l1 1 4-4" />
                <path d="M12 16v3" />
              </svg>
            </div>
            <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "0.5rem" }}>
              AI Security Copilot
            </h1>
            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.9375rem", maxWidth: "42rem", margin: "0 auto" }}>
              Your on-chain security assistant. Ask anything about token safety, risk factors, and smart contract behaviour.
              Open the copilot from the floating button in the bottom-right corner.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="wb-card p-5 text-center">
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", fontSize: "1rem", marginBottom: "0.5rem" }}>
                  {c.title}
                </h3>
                <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.8rem", lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="wb-card p-6 pr-24">
            <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
              Example questions
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Is this token safe?",
                "Why is the score low?",
                "What does Honeypot mean?",
                "Can the owner rug pull?",
                "Is liquidity locked?",
                "Compare this token with USDC",
              ].map((q) => (
                <span
                  key={q}
                  style={{
                    background: "var(--wb-color-primary-soft)",
                    border: "1px solid var(--wb-color-border)",
                    borderRadius: "var(--wb-radius-md)",
                    padding: "0.375rem 0.875rem",
                    fontSize: "0.8rem",
                    color: "var(--wb-color-primary)",
                    fontWeight: 500,
                  }}
                >
                  “{q}”
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AISecurityCopilot />
    </div>
  );
}
