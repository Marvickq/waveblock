"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BlockchainCanvas from "@/components/BlockchainCanvas";
import AnimatedCounter from "@/components/AnimatedCounter";
import TrustScoreGauge from "@/components/TrustScoreGauge";

/* ── Scroll Reveal Hook ─────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── FAQ Accordion ──────────────────────────────────────── */
const FAQS = [
  {
    q: "What is a Trust Score?",
    a: "A Trust Score is WaveBlock's proprietary 0–100 rating that aggregates contract verification, ownership renouncement, liquidity lock status, holder distribution, and historical rug-pull indicators into a single actionable number.",
  },
  {
    q: "Does WaveBlock execute any swaps or transactions?",
    a: "No. WaveBlock is a read-only analysis platform. We never request transaction signatures, move funds, or interact with your wallet beyond verifying your address via Sign-In With Ethereum.",
  },
  {
    q: "How does the AI generate the Trust Report?",
    a: "Our AI analyses on-chain data — contract bytecode, ownership, liquidity pools, and holder patterns — and synthesises findings into a human-readable report highlighting specific risk vectors.",
  },
  {
    q: "Which blockchains are supported?",
    a: "WaveBlock currently supports Ethereum Mainnet. Polygon, BSC, and Arbitrum are on the roadmap for Q3 2025.",
  },
  {
    q: "Is WaveBlock free to use?",
    a: "Yes — the MVP is free. Premium tiers with portfolio monitoring, PDF export, and compare tools are planned for the full release.",
  },
];

/* ── Hero CTA: Magnetic Button ──────────────────────────── */
function MagneticButton({ children, href, id }: { children: React.ReactNode; href: string; id?: string }) {
  const btn = useRef<HTMLAnchorElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    if (!btn.current) return;
    const rect = btn.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.current.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
  };
  const handleLeave = () => {
    if (btn.current) btn.current.style.transform = "translate(0,0)";
  };

  return (
    <a
      ref={btn}
      id={id}
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="btn-primary"
      style={{
        padding: "0.9rem 2.25rem",
        fontSize: "1rem",
        borderRadius: "var(--wb-radius-xl)",
        boxShadow: "var(--wb-shadow-button-hover)",
        transition: "transform var(--wb-duration-fast) var(--wb-ease-standard), box-shadow var(--wb-duration-fast) var(--wb-ease-standard)",
      }}
    >
      {children}
    </a>
  );
}

/* ── Feature Card ───────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay = 0 }: { icon: string; title: string; desc: string; delay?: number }) {
  return (
    <div className="wb-card reveal p-6 group" style={{ transitionDelay: `${delay}ms` }}>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-xl"
        style={{ background: "var(--wb-color-primary-soft)" }}
      >
        {icon}
      </div>
      <h3 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.1rem", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "0.5rem" }}>
        {title}
      </h3>
      <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.9rem", lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

/* ── Step Card ──────────────────────────────────────────── */
function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center reveal">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4"
        style={{
          background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))",
          boxShadow: "var(--wb-shadow-button-hover)",
        }}
      >
        {num}
      </div>
      <h3 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.2rem", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "0.5rem" }}>
        {title}
      </h3>
      <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: "240px" }}>{desc}</p>
    </div>
  );
}

/* ── FAQ Item ───────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="wb-card overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
      style={{ marginBottom: "1.5rem" }}
    >
      <div className="flex items-center justify-between p-6 md:p-8">
        <h3 style={{ fontFamily: "var(--wb-font-ui)", fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "1.1rem" }}>
          {q}
        </h3>
        <span
          style={{
            color: "var(--wb-color-primary)",
            transition: `transform var(--wb-duration-normal) var(--wb-ease-standard)`,
            display: "inline-block",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            flexShrink: 0,
            marginLeft: "1rem",
            fontSize: "1.25rem",
            lineHeight: 1,
          }}
        >
          +
        </span>
      </div>
      <div
        style={{
          maxHeight: open ? "300px" : "0",
          overflow: "hidden",
          transition: `max-height var(--wb-duration-slow) var(--wb-ease-enter)`,
        }}
      >
        <p style={{ padding: "0 2rem 2rem", color: "var(--wb-color-text-secondary)", lineHeight: 1.8, fontSize: "1rem" }}>{a}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════ */
export default function Home() {
  useReveal();
  const [stats, setStats] = useState<{ tokensAnalysed: number; usersProtected: number; walletsConnected: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const json = await res.json();
          setStats({ tokensAnalysed: json.tokensAnalysed ?? 0, usersProtected: json.usersProtected ?? 0, walletsConnected: json.walletsConnected ?? 0 });
        }
      } catch {
        // Stats unavailable
      }
    })();
  }, []);

  return (
    <div className="page-in relative" style={{ marginTop: "calc(-1 * var(--wb-navbar-height, 64px))" }}>
      <BlockchainCanvas />

      {/* Hero overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>

        {/* ── HERO ──────────────────────────────────────── */}
        <section
          style={{
            minHeight: "100vh",
            width: "100vw",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "url('/hero-mountain.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Dark Overlay (40-55%) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(23, 23, 33, 0.50)",
              zIndex: 1,
            }}
          />

          {/* Centered Content Stack (max 640px) */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "640px",
              width: "100%",
              margin: "0 auto",
              padding: "var(--wb-navbar-height) 1.5rem 6rem",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--wb-font-display)",
                fontSize: "81px",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "rgba(255, 255, 255, 0.6)",
                letterSpacing: "0.01em",
                marginBottom: "144px",
              }}
            >
              WaveBlock
            </p>

            <h1
              style={{
                fontFamily: "var(--wb-font-display)",
                fontSize: "65px",
                fontWeight: 400,
                lineHeight: 1.1,
                color: "var(--color-ivory-text)",
                letterSpacing: "0.01em",
                marginBottom: "1.5rem",
              }}
            >
              Know Before You Swap.
            </h1>

            <p
              style={{
                fontFamily: "var(--wb-font-ui)",
                fontSize: "18px",
                lineHeight: 1.5,
                color: "var(--color-ash-text)",
                marginBottom: "2.5rem",
                fontWeight: 400,
              }}
            >
              WaveBlock analyzes smart contracts, liquidity, ownership, taxes, and on-chain behavior before every transaction, helping investors make informed decisions with enterprise-grade AI security intelligence.
            </p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/dashboard"
                id="hero-primary-cta"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--color-cobalt)",
                  color: "#ffffff",
                  fontFamily: "var(--wb-font-ui)",
                  fontSize: "16px",
                  fontWeight: 400,
                  padding: "0.85rem 2rem",
                  borderRadius: "32px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  border: "none",
                  boxShadow: "0 0 20px rgba(82, 102, 235, 0.4)",
                }}
              >
                Analyze Token
              </Link>
              <Link
                href="/docs"
                id="hero-ghost-cta"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  color: "var(--color-ivory-text)",
                  fontFamily: "var(--wb-font-ui)",
                  fontSize: "16px",
                  fontWeight: 400,
                  padding: "0.85rem 2rem",
                  borderRadius: "40px",
                  textDecoration: "none",
                  border: "1px solid var(--color-mist-border)",
                  transition: "all 0.2s ease",
                }}
              >
                Documentation
              </Link>
            </div>
          </div>
        </section>

        {/* ── TRY WAVEBLOCK FEATURES ─────────────────────── */}
        <section style={{ backgroundColor: "#171721", padding: "96px 0", borderBottom: "1px solid #272735" }}>
          <div className="wb-container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "36px", color: "var(--color-ivory-text)", fontWeight: 400 }}>
                Try WaveBlock Features
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {[
                { title: "Dashboard", desc: "Analyze any token", link: "/dashboard" },
                { title: "Portfolio Guardian", desc: "Monitor your holdings", link: "/portfolio" },
                { title: "AI Copilot", desc: "Ask security questions", link: "/copilot" },
                { title: "Intelligence Reports", desc: "View detailed audits", link: "/reports" },
                { title: "Documentation", desc: "Learn how it works", link: "/docs" },
                { title: "Settings", desc: "Manage your preferences", link: "/settings" }
              ].map(({ title, desc, link }) => (
                <Link key={title} href={link} style={{ backgroundColor: "#1e1e2a", borderRadius: "12px", padding: "24px", textDecoration: "none", border: "1px solid #272735", display: "flex", flexDirection: "column", gap: "8px", transition: "all 0.2s ease" }}>
                  <h3 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "18px", fontWeight: 600, color: "var(--color-ivory-text)" }}>{title}</h3>
                  <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-ash-text)" }}>{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY WAVEBLOCK ──────────────────────────────── */}
        <section style={{ backgroundColor: "#171721", padding: "72px 0", borderBottom: "1px solid #272735" }}>
          <div className="wb-container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "12px", letterSpacing: "0.08em", color: "var(--color-cobalt)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Why WaveBlock
              </p>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "36px", color: "var(--color-ivory-text)", fontWeight: 400 }}>
                Enterprise Security Intelligence for Web3
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              <div style={{ backgroundColor: "#1e1e2a", borderRadius: "12px", padding: "32px", border: "none" }}>
                <h3 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "20px", fontWeight: 600, color: "var(--color-ivory-text)", marginBottom: "0.75rem" }}>
                  Analyze Before You Invest
                </h3>
                <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-ash-text)", lineHeight: 1.6 }}>
                  AI-powered smart contract analysis designed to uncover hidden risks, proxy contracts, and malicious functions before transactions occur.
                </p>
              </div>

              <div style={{ backgroundColor: "#1e1e2a", borderRadius: "12px", padding: "32px", border: "none" }}>
                <h3 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "20px", fontWeight: 600, color: "var(--color-ivory-text)", marginBottom: "0.75rem" }}>
                  Institutional Trust Scores
                </h3>
                <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-ash-text)", lineHeight: 1.6 }}>
                  Comprehensive trust scoring generated from liquidity, ownership renouncement, tax analysis, and on-chain behavioral intelligence.
                </p>
              </div>

              <div style={{ backgroundColor: "#1e1e2a", borderRadius: "12px", padding: "32px", border: "none" }}>
                <h3 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "20px", fontWeight: 600, color: "var(--color-ivory-text)", marginBottom: "0.75rem" }}>
                  Enterprise Security Intelligence
                </h3>
                <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-ash-text)", lineHeight: 1.6 }}>
                  Continuous blockchain monitoring powered by AI models and real-time on-chain analytics rather than market speculation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW WAVEBLOCK WORKS ───────────────────────── */}
        <section style={{ padding: "72px 0", backgroundColor: "#171721" }}>
          <div className="wb-container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "12px", letterSpacing: "0.08em", color: "var(--color-cobalt)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                How WaveBlock Works
              </p>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "36px", color: "var(--color-ivory-text)", fontWeight: 400 }}>
                Four steps to intelligent security
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
              {[
                { step: "Connect", desc: "Connect an existing wallet securely without exposing private keys." },
                { step: "Analyze", desc: "Scan contracts, wallets, or tokens using multiple security engines." },
                { step: "Understand", desc: "Receive AI-generated explanations, trust scores, and detailed risk breakdowns." },
                { step: "Decide", desc: "Review all available intelligence before interacting with the blockchain." },
              ].map(({ step, desc }, index) => (
                <div
                  key={step}
                  style={{
                    backgroundColor: "#1e1e2a",
                    borderRadius: "12px",
                    padding: "32px",
                    border: "none",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontFamily: "var(--wb-font-ui)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-cobalt)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    0{index + 1}
                  </span>
                  <h3 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "20px", fontWeight: 600, color: "var(--color-ivory-text)", marginBottom: "0.5rem" }}>
                    {step}
                  </h3>
                  <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-ash-text)", lineHeight: 1.5 }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECURITY ENGINE ───────────────────────────── */}
        <section style={{ padding: "72px 0", backgroundColor: "#171721", borderBottom: "1px solid #272735" }}>
          <div className="wb-container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", alignItems: "center" }}>
              <div style={{ backgroundColor: "#1e1e2a", borderRadius: "12px", padding: "32px", border: "none" }}>

                <h4 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "18px", color: "var(--color-ivory-text)", fontWeight: 600, marginBottom: "1rem" }}>
                  Real-time Bytecode & Ownership Analysis
                </h4>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {["Smart Contract Verification", "Honeypot & Tax Detection", "Proxy Contract Resolution", "Whale Holder Risk Mapping"].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "8px 12px", backgroundColor: "#171721", borderRadius: "8px" }}>
                      <span style={{ color: "var(--color-success)" }}>✓</span>
                      <span style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-ivory-text)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "12px", letterSpacing: "0.08em", color: "var(--color-cobalt)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Security Engine
                </p>
                <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "36px", color: "var(--color-ivory-text)", fontWeight: 400, marginBottom: "1rem" }}>
                  Multi-Layered Blockchain Risk Assessment
                </h2>
                <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "15px", color: "var(--color-ash-text)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  WaveBlock's automated scanning engine analyzes contract verification, ownership centralization, liquidity pool locks, buy/sell taxes, and proxy delegates to give you complete clarity.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="section" style={{ background: "var(--wb-color-surface)", backdropFilter: "blur(16px)" }}>
          <div className="wb-container">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="reveal">
                <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>Live Preview</p>
                <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,2.8rem)", color: "var(--wb-color-text-primary)", fontWeight: 400, lineHeight: 1.2, marginBottom: "1.25rem" }}>
                  A Trust Report that speaks plain English
                </h2>
                <p style={{ color: "var(--wb-color-text-secondary)", lineHeight: 1.75, marginBottom: "2rem" }}>
                  No jargon. No opaque scores. WaveBlock translates on-chain complexity into
                  a clear verdict — so you can decide in seconds, not hours.
                </p>
                <Link
                  href="/dashboard"
                  className="btn-primary"
                  style={{ display: "inline-flex", gap: "0.5rem", padding: "0.8rem 1.75rem", boxShadow: "0 0 20px rgba(82, 102, 235, 0.4)" }}
                >
                  Try the Dashboard
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Mockup card */}
              <div className="wb-card reveal p-7" style={{ transitionDelay: "150ms" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.1rem", fontWeight: 500, color: "var(--wb-color-text-primary)" }}>PEPE Token</p>
                    <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--wb-font-mono)" }}>0x6982...bac3</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold risk-low">Low Risk</span>
                </div>

                <div className="flex gap-6 items-center mb-6">
                  <TrustScoreGauge score={82} size={120} animated={false} />
                  <div className="space-y-3 flex-1">
                    {[
                      { label: "Contract Verified", status: true },
                      { label: "Ownership Renounced", status: true },
                      { label: "Liquidity Locked", status: true },
                      { label: "Honeypot", status: false, invert: true },
                    ].map(({ label, status, invert }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.8rem" }}>{label}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: (invert ? !status : status) ? "#16A34A" : "#DC2626" }}>
                          {(invert ? !status : status) ? "✓ Yes" : "✗ No"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--wb-color-ai-background)",
                    borderRadius: "var(--wb-radius-md)",
                    padding: "0.875rem 1rem",
                    border: "1px solid var(--wb-color-ai-border)",
                    color: "var(--wb-color-text-secondary)",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: "var(--wb-color-ai-accent)", fontWeight: 600 }}>WaveBlock AI: </span>
                  This contract scores 82/100. Ownership has been renounced and liquidity is locked for 12 months. No hidden mint functions detected. Safe to interact with.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────── */}
        <section className="section">
          <div className="wb-container">
            <div className="text-center mb-16 reveal">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>Features</p>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", color: "var(--wb-color-text-primary)", fontWeight: 400 }}>
                Everything you need to invest safely
              </h2>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
              <FeatureCard delay={0}   icon="🛡️" title="AI Trust Score"            desc="A 0–100 composite score synthesised from contract, ownership, liquidity, and social signals." />
              <FeatureCard delay={60}  icon="🔍" title="Contract Verification"      desc="Instantly checks if source code is verified on Etherscan and scans for hidden admin functions." />
              <FeatureCard delay={120} icon="💧" title="Liquidity Analysis"         desc="Measures pool depth, checks whether liquidity is locked, and estimates sell-side risk." />
              <FeatureCard delay={180} icon="👤" title="Ownership Intelligence"     desc="Detects centralised ownership, team wallet concentration, and renouncement status." />
              <FeatureCard delay={240} icon="📊" title="Holder Distribution"        desc="Visual breakdown of token holders — surfacing whale concentration and insider patterns." />
              <FeatureCard delay={300} icon="🤖" title="Plain-English AI Report"    desc="A full narrative analysis written by AI, not a list of cryptic flags — built for humans." />
            </div>
          </div>
        </section>

        {/* ── PORTFOLIO INTELLIGENCE & GUARDIAN ─────────── */}
        <section style={{ padding: "72px 0", backgroundColor: "#171721", borderBottom: "1px solid #272735" }}>
          <div className="wb-container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "12px", letterSpacing: "0.08em", color: "var(--color-cobalt)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Institutional Intelligence
              </p>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "36px", color: "var(--color-ivory-text)", fontWeight: 400 }}>
                Portfolio Monitoring & Transaction Guardian
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {/* Portfolio Card */}
              <div style={{ backgroundColor: "#1e1e2a", borderRadius: "12px", padding: "32px", border: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "20px", fontWeight: 600, color: "var(--color-ivory-text)" }}>
                    Portfolio Health
                  </h3>
                  <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", backgroundColor: "rgba(66, 184, 131, 0.15)", color: "var(--color-success)", fontWeight: 600 }}>
                    HEALTHY (94/100)
                  </span>
                </div>
                <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-ash-text)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  Continuous tracking of your connected wallet holdings, alerting you to sudden ownership transfers or liquidity drains in real time.
                </p>
                <Link href="/portfolio" style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-cobalt)", textDecoration: "none", fontWeight: 500 }}>
                  View Portfolio Analytics →
                </Link>
              </div>

              {/* Guardian Card */}
              <div style={{ backgroundColor: "#1e1e2a", borderRadius: "12px", padding: "32px", border: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontFamily: "var(--wb-font-ui)", fontSize: "20px", fontWeight: 600, color: "var(--color-ivory-text)" }}>
                    Transaction Guardian
                  </h3>
                  <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", backgroundColor: "rgba(244, 185, 66, 0.15)", color: "var(--color-warning)", fontWeight: 600 }}>
                    SIMULATOR ACTIVE
                  </span>
                </div>
                <p style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-ash-text)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  Simulate swaps before execution to detect hidden transfer fees, malicious approvals, high gas surges, or proxy redirects.
                </p>
                <Link href="/guardian" style={{ fontFamily: "var(--wb-font-ui)", fontSize: "14px", color: "var(--color-cobalt)", textDecoration: "none", fontWeight: 500 }}>
                  Simulate Transaction →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ──────────────────────────── */}
        <section className="section" style={{ background: "var(--wb-color-surface)", backdropFilter: "blur(16px)" }}>
          <div className="wb-container">
            <div className="text-center mb-12 reveal">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>Positioning</p>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", color: "var(--wb-color-text-primary)", fontWeight: 400 }}>
                Why not just use a DEX?
              </h2>
            </div>

            <div className="wb-card reveal overflow-hidden">
              <div style={{ overflowX: "auto" }}>
                <table className="wb-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th style={{ textAlign: "center", color: "var(--wb-color-primary)" }}>WaveBlock</th>
                      <th style={{ textAlign: "center" }}>Uniswap / DEX</th>
                      <th style={{ textAlign: "center" }}>Etherscan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["AI Trust Score",              "✓","–","–"],
                      ["Plain-English Risk Report",   "✓","–","–"],
                      ["Rug-Pull Detection",          "✓","–","Partial"],
                      ["Ownership Analysis",          "✓","–","Manual"],
                      ["Liquidity Lock Status",       "✓","–","Manual"],
                      ["Holder Distribution Chart",   "✓","–","Basic"],
                      ["No Wallet Signature Required","✓","–","✓"],
                      ["Swap Execution",              "–","✓","–"],
                    ].map(([feat, wb, dex, es]) => (
                      <tr key={feat}>
                        <td style={{ color: "var(--wb-color-text-primary)", fontWeight: 500 }}>{feat}</td>
                        <td style={{ textAlign: "center", color: wb === "✓" ? "var(--wb-color-success)" : "var(--wb-color-danger)", fontWeight: 700, fontSize: "1rem" }}>{wb}</td>
                        <td style={{ textAlign: "center", color: dex === "✓" ? "var(--wb-color-success)" : dex === "–" ? "var(--wb-color-text-disabled)" : "var(--wb-color-warning)", fontWeight: 600 }}>{dex}</td>
                        <td style={{ textAlign: "center", color: es === "✓" ? "var(--wb-color-success)" : es === "–" ? "var(--wb-color-text-disabled)" : "var(--wb-color-warning)", fontWeight: 600 }}>{es}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────── */}
        <section className="section">
          <div className="wb-container" style={{ maxWidth: "800px" }}>
            <div className="text-center mb-12 reveal">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>FAQ</p>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", color: "var(--wb-color-text-primary)", fontWeight: 400 }}>
                Common questions
              </h2>
            </div>
            {FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        {/* ── FOOTER CTA ────────────────────────────────── */}
        <section
          className="section text-center"
          style={{
            background: "linear-gradient(135deg, var(--wb-color-primary-soft), rgba(50,197,255,0.04))",
            borderTop: "1px solid var(--wb-color-border)",
          }}
        >
          <div className="wb-container reveal">
            <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2.2rem,4vw,3.5rem)", color: "var(--wb-color-text-primary)", fontWeight: 400, marginBottom: "1.25rem" }}>
              Ready to invest with confidence?
            </h2>
            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
              Analyse your first token for free — no sign-up required.
            </p>
            <MagneticButton href="/dashboard" id="footer-cta-dashboard">
              Analyse a Token Now
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </MagneticButton>
          </div>
        </section>

        <footer
          style={{
            background: "var(--wb-color-footer)",
            borderTop: "1px solid var(--wb-color-border)",
            padding: "var(--wb-space-48) var(--wb-space-24)",
          }}
        >
          <div className="wb-container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M2 10 Q5 2 8 8 Q11 14 14 6" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                  <span style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.2rem", color: "var(--wb-color-text-primary)" }}>WaveBlock</span>
                </div>
                <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>Premium AI-powered token security analysis for the DeFi ecosystem.</p>
              </div>
              <div className="flex flex-col items-center md:items-end text-center md:text-right gap-2">
                <p style={{ color: "var(--wb-color-text-disabled)", fontSize: "0.85rem" }}>Not financial advice. Always DYOR.</p>
                <p style={{ color: "var(--wb-color-text-disabled)", fontSize: "0.85rem" }}>© 2025 WaveBlock. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>

      </div>{/* /relative z-2 */}
    </div>
  );
}
