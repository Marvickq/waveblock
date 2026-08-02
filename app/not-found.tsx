"use client";
import Link from "next/link";
import BlockchainCanvas from "@/components/BlockchainCanvas";

export default function NotFound() {
  return (
    <div className="page-in relative min-h-screen flex items-center justify-center">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "2rem" }}>
        {/* Score Gauge — styled as 404 */}
        <div className="mb-8 flex justify-center">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="70" fill="none" stroke="var(--wb-color-border)" strokeWidth="14" />
            <circle
              cx="90" cy="90" r="70"
              fill="none"
              stroke="var(--wb-trust-critical)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="330"
              strokeDashoffset="80"
              transform="rotate(-90 90 90)"
              style={{ filter: "drop-shadow(0 0 10px var(--wb-trust-critical))" }}
            />
            <text x="90" y="84" textAnchor="middle" style={{ fontFamily: "var(--wb-font-display)", fontSize: "36px", fill: "var(--wb-trust-critical)", fontWeight: 400 }}>
              404
            </text>
            <text x="90" y="104" textAnchor="middle" style={{ fontFamily: "var(--wb-font-ui)", fontSize: "11px", fill: "var(--wb-color-text-muted)", fontWeight: 500 }}>
              PAGE NOT FOUND
            </text>
          </svg>
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-6 risk-critical">Critical Risk</span>

        <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "1rem" }}>
          This page has been rugged
        </h1>
        <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1rem", maxWidth: "420px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let WaveBlock scan you to safety.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary"
            style={{ padding: "0.875rem 2rem", borderRadius: "var(--wb-radius-md)" }}
          >
            ← Back to Safety
          </Link>
          <Link
            href="/dashboard"
            className="btn-secondary"
            style={{ padding: "0.875rem 2rem", borderRadius: "var(--wb-radius-md)" }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
