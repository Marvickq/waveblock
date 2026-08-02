"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  analysisId?: string;
}

interface TokenContext {
  address: string;
  name: string;
  symbol: string;
  trustScore: number;
  analysisDate: Date;
}

interface RecentAnalysis {
  address: string;
  name: string;
  score: number;
  timestamp: Date;
}

export default function AISecurityCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState<TokenContext | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRecentAnalyses = async () => {
    try {
      const response = await fetch('/api/report?limit=5');
      if (response.ok) {
        const data = await response.json();
        const analyses = data.analyses || [];
        setRecentAnalyses(analyses.map((a: any) => ({
          address: a.tokenAddress,
          name: a.tokenName,
          score: a.trustScore,
          timestamp: new Date(a.createdAt),
        })));
      }
    } catch (error) {
      console.error('Failed to load recent analyses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      analysisId: currentToken?.address,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          tokenAddress: currentToken?.address,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response,
        timestamp: new Date(),
        analysisId: currentToken?.address,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Copilot error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'I apologize, but I encountered an error processing your request. Please try again or ask a simpler question about the token analysis. You can ask about the token safety, risk factors, or request a comparison with other tokens.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Is this token safe?",
    "Why is the score low?",
    "What does 'Honeypot' mean?",
    "Can the owner rug pull?",
    "Is liquidity locked?",
    "Compare this token with USDC",
    "Explain like I'm a beginner",
  ];

  const startNewChat = () => {
    setMessages([]);
    setCurrentToken(null);
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "var(--wb-trust-excellent)";
    if (score >= 60) return "var(--wb-trust-review)";
    return "var(--wb-trust-critical)";
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            if (messages.length === 0) {
              loadRecentAnalyses();
            }
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-2xl transition-all duration-300 flex items-center justify-center group"
          style={{
            background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))",
            boxShadow: "var(--wb-shadow-button-hover)",
            border: "none",
            cursor: "pointer",
          }}
          title="AI Security Copilot"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 10h.01" />
            <path d="M12 10h.01" />
            <path d="M16 10h.01" />
            <path d="M9 14l1 1 4-4" />
            <path d="M12 16v3" />
            <path d="M8 16h8" />
          </svg>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-96 flex flex-col shadow-2xl"
            style={{
              background: "var(--wb-color-ai-background)",
              borderLeft: "1px solid var(--wb-color-ai-border)",
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border" style={{ background: "rgba(20,26,38,0.22)", backdropFilter: "blur(var(--wb-blur-glass))", WebkitBackdropFilter: "blur(var(--wb-blur-glass))" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 10h.01" />
                      <path d="M12 10h.01" />
                      <path d="M16 10h.01" />
                      <path d="M9 14l1 1 4-4" />
                      <path d="M12 16v3" />
                      <path d="M8 16h8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: "var(--wb-color-text-primary)" }}>WaveBlock AI</h3>
                    <p className="text-xs" style={{ color: "var(--wb-color-text-muted)" }}>Crypto Security Copilot</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg"
                  style={{ background: "transparent", border: "none", color: "var(--wb-color-text-secondary)", cursor: "pointer" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {currentToken && (
                <div className="mt-3 p-3 rounded-lg border" style={{ background: "var(--wb-color-surface)", borderColor: "var(--wb-color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm" style={{ color: scoreColor(currentToken.trustScore) }}>
                        {currentToken.name} ({currentToken.symbol})
                      </p>
                      <p className="text-xs font-mono" style={{ color: "var(--wb-color-text-muted)" }}>
                        {currentToken.address.slice(0, 6)}...{currentToken.address.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: scoreColor(currentToken.trustScore) }}>
                        {currentToken.trustScore}/100
                      </div>
                      <div className="text-xs" style={{ color: "var(--wb-color-text-muted)" }}>
                        {currentToken.trustScore >= 80 ? 'Safe' : currentToken.trustScore >= 60 ? 'Caution' : currentToken.trustScore >= 40 ? 'Risky' : 'Critical'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!currentToken && messages.length === 0 && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: "var(--wb-color-surface)" }}>
                  <p className="text-sm mb-2" style={{ color: "var(--wb-color-text-secondary)" }}>Welcome! Ask me anything about token safety:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(q)}
                        className="px-3 py-1 rounded-full text-xs"
                        style={{
                          background: "var(--wb-color-background)",
                          border: "1px solid var(--wb-color-border)",
                          color: "var(--wb-color-text-primary)",
                          cursor: "pointer",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm`}
                      style={{
                        background: message.role === 'user' ? "var(--wb-color-primary)" : "var(--wb-color-surface)",
                        color: message.role === 'user' ? "#ffffff" : "var(--wb-color-text-primary)",
                        border: message.role === 'user' ? "none" : "1px solid var(--wb-color-border)",
                        borderRadius: message.role === 'user' ? "1rem 1rem 0.125rem 1rem" : "1rem 1rem 1rem 0.125rem",
                      }}
                    >
                      {message.role === 'ai' && (
                        <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: "1px solid var(--wb-color-border-soft)" }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M8 10h.01" />
                              <path d="M12 10h.01" />
                              <path d="M16 10h.01" />
                              <path d="M9 14l1 1 4-4" />
                              <path d="M12 16v3" />
                              <path d="M8 16h8" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium" style={{ color: "var(--wb-color-primary)" }}>WaveBlock AI</span>
                          <span className="text-xs ml-auto" style={{ color: "var(--wb-color-text-muted)" }}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}

                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {message.role === 'user' && (
                        <div className="text-xs mt-1 text-right" style={{ color: "rgba(255,255,255,0.72)" }}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: "var(--wb-color-surface)", border: "1px solid var(--wb-color-border)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 10h.01" />
                          <path d="M12 10h.01" />
                          <path d="M16 10h.01" />
                          <path d="M9 14l1 1 4-4" />
                          <path d="M12 16v3" />
                          <path d="M8 16h8" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--wb-color-primary)" }}>WaveBlock AI</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--wb-color-primary)", animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--wb-color-primary)", animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--wb-color-primary)", animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Recent Analyses */}
            {messages.length === 0 && (
              <div className="p-4 border-t" style={{ borderColor: "var(--wb-color-border)" }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--wb-color-text-primary)" }}>Recent Analyses</h4>
                <div className="space-y-2">
                  {recentAnalyses.map((analysis, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentToken({
                          address: analysis.address,
                          name: analysis.name,
                          symbol: analysis.address.slice(0, 4).toUpperCase(),
                          trustScore: analysis.score,
                          analysisDate: analysis.timestamp,
                        });
                        setMessages([{
                          id: Date.now().toString(),
                          role: 'ai',
                          content: `I'm ready to analyze ${analysis.name} (${analysis.address.slice(0, 6)}...${analysis.address.slice(-4)}) with a Trust Score of ${analysis.score}/100. What would you like to know about this token's safety?`,
                          timestamp: new Date(),
                        }]);
                      }}
                      className="w-full text-left p-3 rounded-lg border transition-all duration-200"
                      style={{
                        background: "var(--wb-color-surface)",
                        borderColor: "var(--wb-color-border)",
                        cursor: "pointer",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm" style={{ color: "var(--wb-color-text-primary)" }}>{
                          analysis.name.length > 15 ? analysis.name.substring(0, 15) + '...' : analysis.name
                        }</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium`} style={{ background: `${scoreColor(analysis.score)}18`, color: scoreColor(analysis.score) }}>
                          {analysis.score}/100
                        </span>
                      </div>
                      <div className="text-xs font-mono" style={{ color: "var(--wb-color-text-muted)" }}>
                        {analysis.address.slice(0, 6)}...{analysis.address.slice(-4)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: "var(--wb-color-border)", background: "rgba(20, 26, 38, 0.45)", backdropFilter: "blur(10px)" }}>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about token safety, risks, or analysis..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-full border"
                  style={{
                    background: "var(--wb-color-background)",
                    borderColor: "var(--wb-color-border-strong)",
                    color: "var(--wb-color-text-primary)",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-12 h-12 rounded-full text-white transition-all duration-200 flex items-center justify-center shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))",
                    border: "none",
                    cursor: (isLoading || !input.trim()) ? "not-allowed" : "pointer",
                    opacity: (isLoading || !input.trim()) ? 0.5 : 1,
                  }}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                      <path d="m9 12 2 2 5-5" />
                    </svg>
                  )}
                </button>
              </form>
              <div className="flex justify-between mt-2 px-2">
                <button
                  onClick={startNewChat}
                  className="text-xs"
                  style={{ background: "transparent", border: "none", color: "var(--wb-color-text-muted)", cursor: "pointer" }}
                >
                  New chat
                </button>
                <button
                  onClick={() => {
                    setCurrentToken(null);
                    setMessages([{
                      id: Date.now().toString(),
                      role: 'ai',
                      content: 'Hello! I can analyze any ERC-20 token and provide detailed security insights. Just paste a contract address and I\'ll tell you exactly what to know before you interact with it.',
                      timestamp: new Date(),
                    }]);
                  }}
                  className="text-xs"
                  style={{ background: "transparent", border: "none", color: "var(--wb-color-text-muted)", cursor: "pointer" }}
                >
                  Clear chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
