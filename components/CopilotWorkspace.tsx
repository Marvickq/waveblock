"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Types ──────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface RecentAnalysis {
  address: string;
  name: string;
  score: number;
  timestamp: Date;
}

/* ─── Helpers ────────────────────────────────────────────── */
const scoreColor = (s: number) =>
  s >= 80 ? "#10B981" : s >= 60 ? "#F5B942" : "#EF4444";

const scoreLabel = (s: number) =>
  s >= 80 ? "Safe" : s >= 60 ? "Caution" : s >= 40 ? "Risky" : "Critical";

const SUGGESTED = [
  "Is this token safe to invest in?",
  "Why is the trust score low?",
  "What does 'Honeypot' mean?",
  "Can the owner rug pull?",
  "Is the liquidity locked?",
  "Compare this token with USDC",
  "Explain smart contract risks",
  "What is a buy/sell tax?",
];

const CAPABILITIES = [
  { icon: "🛡️", title: "Token Safety", desc: "Honeypot risk, taxes, liquidity, holder concentration." },
  { icon: "🔍", title: "Risk Analysis", desc: "Understand trust scores and what risk flags really mean." },
  { icon: "📖", title: "Beginner Mode", desc: "Plain-English breakdowns of complex DeFi concepts." },
  { icon: "⚖️", title: "Comparisons", desc: "Side-by-side security & market data for any two tokens." },
];

/* ─── Message Bubble ─────────────────────────────────────── */
function Bubble({ msg }: { msg: Message }) {
  const isAI = msg.role === "ai";
  return (
    <div className={`flex gap-4 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && (
        <div
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))", marginTop: "4px" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" />
            <path d="M9 14l1 1 4-4" />
          </svg>
        </div>
      )}

      <div
        className="max-w-[78%] rounded-2xl px-6 py-4"
        style={{
          background: isAI ? "var(--wb-color-surface)" : "var(--wb-color-primary)",
          color: isAI ? "var(--wb-color-text-primary)" : "#fff",
          border: isAI ? "1px solid rgba(255,255,255,0.07)" : "none",
          borderRadius: isAI ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
        }}
      >
        {isAI && (
          <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ color: "var(--wb-color-primary)", fontSize: "0.85rem", fontWeight: 600 }}>WaveBlock AI</span>
            <span className="ml-auto" style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem" }}>
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
        <p style={{ fontSize: "1rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.content}</p>
        {!isAI && (
          <p className="mt-2 text-right" style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem" }}>
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Typing Indicator ───────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex gap-4 justify-start">
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))", marginTop: "4px" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" />
          <path d="M9 14l1 1 4-4" />
        </svg>
      </div>
      <div
        className="px-6 py-4 rounded-2xl flex items-center gap-2"
        style={{ background: "var(--wb-color-surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 18px 18px 18px" }}
      >
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: "var(--wb-color-primary)", animationDelay: `${delay}ms` }}
          />
        ))}
        <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", marginLeft: "4px" }}>Thinking…</span>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function CopilotWorkspace() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [activeToken, setActiveToken] = useState<{ address: string; name: string; score: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    fetch("/api/report?limit=5")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.analyses) {
          setRecentAnalyses(
            data.analyses.map((a: any) => ({
              address: a.tokenAddress,
              name: a.tokenName,
              score: a.trustScore,
              timestamp: new Date(a.createdAt),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          tokenAddress: activeToken?.address,
          conversationHistory: messages,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "I encountered an error processing your request. Please try again or ask about a specific token's safety.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, activeToken]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const selectToken = (a: RecentAnalysis) => {
    setActiveToken({ address: a.address, name: a.name, score: a.score });
    setMessages([{
      id: Date.now().toString(),
      role: "ai",
      content: `I'm ready to analyze **${a.name}** (${a.address.slice(0, 6)}...${a.address.slice(-4)}) — Trust Score: ${a.score}/100.\n\nWhat would you like to know about this token's security?`,
      timestamp: new Date(),
    }]);
  };

  const clearChat = () => {
    setMessages([]);
    setActiveToken(null);
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex"
      style={{
        minHeight: "100vh",
        paddingTop: "var(--wb-navbar-height, 64px)",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "var(--wb-navbar-height, 64px) 24px 0",
        gap: "24px",
      }}
    >
      {/* ════════════ LEFT SIDEBAR (25%) ════════════ */}
      <aside
        className="hidden lg:flex flex-col gap-6 flex-shrink-0"
        style={{
          width: sidebarOpen ? "340px" : "0px",
          overflow: sidebarOpen ? "visible" : "hidden",
          transition: "width 0.3s ease",
          paddingBottom: "24px",
        }}
      >
        {/* Brand Header */}
        <div className="wb-card p-7 rounded-2xl enterprise-card">
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))", boxShadow: "0 4px 20px rgba(79,124,255,0.3)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 10h.01M12 10h.01M16 10h.01" />
                <path d="M9 14l1 1 4-4" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.15rem", fontWeight: 600, color: "var(--wb-color-text-primary)", marginBottom: "3px" }}>
                WaveBlock AI
              </h2>
              <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem" }}>Security Copilot</p>
            </div>
            <div className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 8px #10B981", animation: "pulse 2s infinite" }} />
          </div>

          {/* Active token context */}
          {activeToken && (
            <div
              className="p-4 rounded-xl mb-2"
              style={{ background: "rgba(79,124,255,0.06)", border: "1px solid rgba(79,124,255,0.15)" }}
            >
              <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Active Context</p>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontWeight: 700, color: "var(--wb-color-text-primary)", fontSize: "0.95rem", marginBottom: "2px" }}>{activeToken.name}</p>
                  <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--wb-font-mono)" }}>
                    {activeToken.address.slice(0, 8)}...{activeToken.address.slice(-4)}
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: `${scoreColor(activeToken.score)}18`, color: scoreColor(activeToken.score), border: `1px solid ${scoreColor(activeToken.score)}30` }}
                >
                  {activeToken.score}/100
                </span>
              </div>
            </div>
          )}

          <button
            onClick={clearChat}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--wb-color-text-secondary)", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,124,255,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            + New Conversation
          </button>
        </div>

        {/* AI Capabilities */}
        <div className="wb-card p-7 rounded-2xl enterprise-card">
          <h3 className="mb-5" style={{ color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            AI Capabilities
          </h3>
          <div className="space-y-4">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="flex items-start gap-4">
                <span style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: "2px" }}>{c.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.95rem", marginBottom: "3px" }}>{c.title}</p>
                  <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="wb-card p-7 rounded-2xl enterprise-card">
          <h3 className="mb-5" style={{ color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Suggested Prompts
          </h3>
          <div className="space-y-2">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "var(--wb-color-text-secondary)", cursor: "pointer" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,124,255,0.25)";
                  (e.currentTarget as HTMLElement).style.color = "var(--wb-color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.color = "var(--wb-color-text-secondary)";
                }}
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Conversation History / Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <div className="wb-card p-7 rounded-2xl enterprise-card">
            <h3 className="mb-5" style={{ color: "var(--wb-color-text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Recent Analyses
            </h3>
            <div className="space-y-3">
              {recentAnalyses.map((a, i) => (
                <button
                  key={i}
                  onClick={() => selectToken(a)}
                  className="w-full text-left p-4 rounded-xl transition-all"
                  style={{
                    background: activeToken?.address === a.address ? "rgba(79,124,255,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${activeToken?.address === a.address ? "rgba(79,124,255,0.25)" : "rgba(255,255,255,0.05)"}`,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { if (activeToken?.address !== a.address) (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,124,255,0.2)"; }}
                  onMouseLeave={(e) => { if (activeToken?.address !== a.address) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontWeight: 600, color: "var(--wb-color-text-primary)", fontSize: "0.9rem" }}>
                      {a.name.length > 16 ? a.name.slice(0, 16) + "…" : a.name}
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: `${scoreColor(a.score)}18`, color: scoreColor(a.score) }}
                    >
                      {a.score}/100
                    </span>
                  </div>
                  <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--wb-font-mono)" }}>
                    {a.address.slice(0, 8)}...{a.address.slice(-4)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ════════════ RIGHT: CHAT WORKSPACE (75%) ════════════ */}
      <div
        className="flex flex-col flex-1"
        style={{ minWidth: 0, paddingBottom: "24px" }}
      >
        {/* Chat Header */}
        <div
          className="wb-card px-7 py-5 rounded-2xl enterprise-card mb-4 flex items-center gap-4"
          style={{ flexShrink: 0 }}
        >
          {/* Sidebar toggle (mobile) */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg"
            style={{ background: "transparent", border: "none", color: "var(--wb-color-text-secondary)", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <div>
            <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.4rem", fontWeight: 600, color: "var(--wb-color-text-primary)", marginBottom: "3px" }}>
              AI Security Copilot
            </h1>
            <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.9rem" }}>
              {activeToken
                ? `Analysing ${activeToken.name} — Trust Score: ${activeToken.score}/100 (${scoreLabel(activeToken.score)})`
                : "Ask anything about token safety, smart contracts, and DeFi risks"}
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="ml-auto px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--wb-color-text-muted)", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)"; (e.currentTarget as HTMLElement).style.color = "var(--wb-color-danger)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--wb-color-text-muted)"; }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div
          className="wb-card rounded-2xl enterprise-card flex-1 overflow-y-auto flex flex-col"
          style={{ minHeight: 0 }}
        >
          <div className="flex-1 overflow-y-auto px-7 py-8 space-y-6">

            {/* Empty state */}
            {isEmpty && (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
                  style={{ background: "rgba(79,124,255,0.06)", border: "1px solid rgba(79,124,255,0.15)" }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--wb-color-primary)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 10h.01M12 10h.01M16 10h.01" />
                    <path d="M9 14l1 1 4-4" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: "var(--wb-font-display)", fontSize: "1.8rem", fontWeight: 600, color: "var(--wb-color-text-primary)", marginBottom: "1rem" }}>
                  How can I help you today?
                </h2>
                <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "1.1rem", maxWidth: "520px", lineHeight: 1.7, marginBottom: "3rem" }}>
                  I&apos;m your on-chain security assistant. Ask about token safety, smart contract risks, or paste any ERC-20 contract address for a deep analysis.
                </p>
                {/* Quick action grid */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
                  {SUGGESTED.slice(0, 4).map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="p-5 rounded-xl text-left transition-all"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,124,255,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(79,124,255,0.05)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                    >
                      <p style={{ color: "var(--wb-color-text-primary)", fontSize: "0.95rem", fontWeight: 500, lineHeight: 1.5 }}>{q}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => <Bubble key={msg.id} msg={msg} />)}

            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Sticky Input Bar ───────────────────────────────────── */}
          <div
            className="px-7 py-5 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="flex items-end gap-4 rounded-2xl px-5 py-4"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", transition: "border-color 0.2s" }}
              onFocusCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,124,255,0.4)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(79,124,255,0.08)"; }}
              onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about token safety, paste a contract address, or ask a DeFi question…"
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontFamily: "var(--wb-font-ui)",
                  fontSize: "1rem",
                  color: "var(--wb-color-text-primary)",
                  lineHeight: 1.6,
                  maxHeight: "160px",
                  overflowY: "auto",
                  paddingTop: "4px",
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 160) + "px";
                }}
              />
              <div className="flex items-center gap-3 flex-shrink-0">
                <span style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem" }}>
                  {input.length > 0 ? "↵ to send" : "Shift+↵ for newline"}
                </span>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: input.trim() && !isLoading
                      ? "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))"
                      : "rgba(255,255,255,0.05)",
                    border: "none",
                    cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                    opacity: !input.trim() && !isLoading ? 0.4 : 1,
                    boxShadow: input.trim() && !isLoading ? "0 4px 15px rgba(79,124,255,0.35)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <p className="mt-3 text-center" style={{ color: "var(--wb-color-text-muted)", fontSize: "0.8rem" }}>
              WaveBlock AI may make mistakes. Always verify on-chain data independently.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .enterprise-card {
          border: 1px solid rgba(255,255,255,0.06) !important;
          background: var(--wb-color-surface) !important;
          box-shadow: none !important;
        }
        .enterprise-card:hover { border-color: rgba(255,255,255,0.08) !important; }
      `}</style>
    </div>
  );
}
