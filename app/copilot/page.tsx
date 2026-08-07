"use client";
import BlockchainCanvas from "@/components/BlockchainCanvas";
import CopilotWorkspace from "@/components/CopilotWorkspace";

export default function CopilotPage() {
  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <CopilotWorkspace />
      </div>
    </div>
  );
}
