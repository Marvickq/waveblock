"use client";
import { useEffect } from "react";
import BlockchainCanvas from "@/components/BlockchainCanvas";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

const STACK = [
  { icon: "⛓️", name: "Ethereum Mainnet", desc: "Real on-chain data via RPC + Etherscan" },
  { icon: "🔬", name: "GoPlus Security API", desc: "Live token security intelligence" },
  { icon: "📊", name: "DexScreener", desc: "Liquidity, volume and price feeds" },
  { icon: "🤖", name: "OpenRouter AI", desc: "Gemini-backed trust report generation" },
  { icon: "🗄️", name: "Prisma + SQLite", desc: "Report history and saved analyses" },
  { icon: "🛠️", name: "Next.js + TypeScript", desc: "Fast, typed full-stack framework" },
];

const VALUES = [
  { icon: "🛡️", title: "Security First",    desc: "Every decision is made through the lens of protecting users from financial harm." },
  { icon: "🔍", title: "Radical Transparency", desc: "Our scoring methodology is open, our reports are human-readable, and our motives are aligned with users — not fees." },
  { icon: "🤝", title: "Accessible",          desc: "Premium security analysis shouldn't require a security PhD. WaveBlock speaks plain English." },
  { icon: "⚡", title: "Real-time Truth",      desc: "On-chain data doesn't lie. We surface it instantly so you can act on facts, not rumours." },
];

export default function AboutPage() {
  useReveal();
  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>

        {/* Hero */}
        <section className="section text-center">
          <div className="wb-container reveal">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>Our Story</p>
            <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", lineHeight: 1.1, marginBottom: "1.5rem" }}>
              We lost money to a rug pull.
              <br />
              <span className="gradient-text">Then we built the antidote.</span>
            </h1>
            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.1rem", lineHeight: 1.8, maxWidth: "640px", margin: "0 auto" }}>
              WaveBlock was born from a $12,000 loss to an undetected honeypot contract. We were experienced
              developers — and we still got fooled. That experience convinced us: DeFi needs a security layer
              built for humans, not machines.
            </p>
          </div>
        </section>

        {/* Vision */}
        <section className="section" style={{ background: "var(--wb-color-surface)", backdropFilter: "blur(16px)" }}>
          <div className="wb-container">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="reveal">
                <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>The Vision</p>
                <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "1.25rem", lineHeight: 1.2 }}>
                  A world where no one loses money to a preventable rug pull
                </h2>
                <p style={{ color: "var(--wb-color-text-secondary)", lineHeight: 1.8, marginBottom: "1rem" }}>
                  We envision DeFi as a truly open financial system — where access to institutional-grade
                  security analysis is available to every participant, not just those with expensive auditors.
                </p>
                <p style={{ color: "var(--wb-color-text-secondary)", lineHeight: 1.8 }}>
                  WaveBlock is the security layer that DeFi deserves: intelligent, transparent, and built
                  with the same standards as the best fintech platforms in the world.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 reveal" style={{ transitionDelay: "150ms" }}>
                {[
                  { num: "$2.6B", label: "Lost to rug pulls in 2023" },
                  { num: "98%",   label: "Of scams are detectable on-chain" },
                  { num: "3min",  label: "Average rug pull duration" },
                  { num: "0",     label: "Seconds it takes WaveBlock to scan" },
                ].map(({ num, label }) => (
                  <div key={label} className="wb-card p-5 text-center">
                    <div style={{ fontFamily: "var(--wb-font-display)", fontSize: "2rem", fontWeight: 400, color: "var(--wb-color-primary)", marginBottom: "0.375rem" }}>{num}</div>
                    <div style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem", lineHeight: 1.4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section">
          <div className="wb-container">
            <div className="text-center mb-14 reveal">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>Values</p>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 400, color: "var(--wb-color-text-primary)" }}>
                What we stand for
              </h2>
            </div>
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
              {VALUES.map(({ icon, title, desc }, i) => (
                <div key={title} className="wb-card reveal p-7" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{icon}</div>
                  <h3 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.15rem", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "0.625rem" }}>{title}</h3>
                  <p style={{ color: "var(--wb-color-text-muted)", lineHeight: 1.7, fontSize: "0.9rem" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Built On */}
        <section className="section" style={{ background: "var(--wb-color-surface)", backdropFilter: "blur(16px)" }}>
          <div className="wb-container">
            <div className="text-center mb-14 reveal">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--wb-color-primary)", letterSpacing: "var(--wb-tracking-wider)" }}>Under the Hood</p>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 400, color: "var(--wb-color-text-primary)" }}>
                Built on real, verifiable data
              </h2>
            </div>
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
              {STACK.map(({ icon, name, desc }, i) => (
                <div key={name} className="wb-card reveal text-center p-6" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{icon}</div>
                  <h3 style={{ fontWeight: 700, color: "var(--wb-color-text-primary)", fontSize: "0.95rem", marginBottom: "0.25rem" }}>{name}</h3>
                  <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem", lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section text-center" style={{ borderTop: "1px solid var(--wb-color-border)" }}>
          <div className="wb-container"><div className="mx-auto max-w-2xl reveal">
            <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "1.25rem" }}>
              Join us in making DeFi safer
            </h2>
            <a
              href="/dashboard"
              className="btn-primary"
              style={{
                display: "inline-flex",
                padding: "0.9rem 2rem",
                borderRadius: "var(--wb-radius-md)"
              }}
            >
              Try WaveBlock Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div></div>
        </section>
      </div>
    </div>
  );
}
