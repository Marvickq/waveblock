"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSiweMessage } from "@/lib/siwe";

const NAV_LINKS = [
  { href: "/",            label: "Home"          },
  { href: "/dashboard",   label: "Dashboard"     },
  { href: "/portfolio",   label: "Portfolio"     },
  { href: "/copilot",     label: "AI Copilot"    },
  { href: "/guardian",    label: "Guardian"      },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/reports",     label: "Reports"       },
  { href: "/docs",        label: "Documentation" },
  { href: "/settings",    label: "Settings"      },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("wb_wallet");
    if (stored) setWallet(stored);
    const storedEns = localStorage.getItem("wb_ens");
    if (storedEns) setEnsName(storedEns);

    const eth = (window as any).ethereum;
    if (!eth) return;

    eth.request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (!accounts || accounts.length === 0 || accounts[0] !== stored) {
          setWallet(null);
          setEnsName(null);
          localStorage.removeItem("wb_wallet");
          localStorage.removeItem("wb_ens");
        }
      })
      .catch(() => {
        setWallet(null);
        setEnsName(null);
        localStorage.removeItem("wb_wallet");
        localStorage.removeItem("wb_ens");
      });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('wb_theme') as 'light' | 'dark' | null;
    const attr = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
    } else if (attr) {
      setTheme(attr);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wb_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet(null);
        setEnsName(null);
        localStorage.removeItem("wb_wallet");
        localStorage.removeItem("wb_ens");
      } else {
        setWallet(accounts[0]);
        localStorage.setItem("wb_wallet", accounts[0]);
        resolveEns(accounts[0]);
        signInWithEthereum(accounts[0]).catch(() => {});
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  async function resolveEns(address: string) {
    try {
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const name = await provider.lookupAddress(address);
      if (name) {
        setEnsName(name);
        localStorage.setItem("wb_ens", name);
      }
    } catch {}
  }

  async function signInWithEthereum(address: string) {
    try {
      setSigningIn(true);
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce, id } = await nonceRes.json();

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const message = createSiweMessage(address, nonce, Number((await provider.getNetwork()).chainId));
      const signature = await signer.signMessage(message);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature, nonceId: id }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({ error: "Verification failed" }));
        throw new Error(errData.error || "Verification failed");
      }
    } catch (err) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as any).message) : String(err);
      console.error("SIWE sign-in failed:", msg || err);
    } finally {
      setSigningIn(false);
    }
  }

  async function connectWallet() {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("MetaMask is not installed. Please install MetaMask to connect.");
      return;
    }
    try {
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts[0]) {
        setWallet(accounts[0]);
        localStorage.setItem("wb_wallet", accounts[0]);
        resolveEns(accounts[0]);
        signInWithEthereum(accounts[0]);
      }
    } catch (err) {
      if ((err as any)?.code === 4001) return;
      console.error("Wallet connection failed:", err);
    }
  }

  function disconnectWallet() {
    setWallet(null);
    setEnsName(null);
    localStorage.removeItem("wb_wallet");
    localStorage.removeItem("wb_ens");
    try {
      fetch("/api/auth/me", { method: "DELETE" });
    } catch {}
  }

  const displayName = ensName || (wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : null);

  return (
    <nav
      className="fixed top-0 left-0 right-0 glass-nav"
      style={{
        zIndex: "var(--wb-z-navbar)",
        boxShadow: scrolled ? "var(--wb-shadow-navbar)" : "none",
        transition: "box-shadow var(--wb-duration-normal) var(--wb-ease-standard)",
      }}
    >
      <div
        className="mx-auto px-6 flex items-center justify-between"
        style={{
          maxWidth: "var(--wb-container-xl)",
          height: "var(--wb-navbar-height)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
            style={{
              background: "linear-gradient(135deg, var(--wb-color-primary), var(--wb-color-accent))",
              transition: "transform var(--wb-duration-fast) var(--wb-ease-spring)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 10 Q5 2 8 8 Q11 14 14 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <span
            className="text-xl font-medium tracking-tight"
            style={{
              fontFamily: "var(--wb-font-display)",
              color: "var(--wb-color-text-primary)",
              transition: "color var(--wb-duration-fast) var(--wb-ease-standard)",
            }}
          >
            WaveBlock
          </span>
        </Link>



        {/* CTA + Wallet + Theme */}
        <div className="hidden md:flex items-center" style={{ gap: "var(--wb-space-12)" }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg"
            style={{
              color: "var(--wb-color-text-secondary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background var(--wb-duration-fast) var(--wb-ease-standard), color var(--wb-duration-fast) var(--wb-ease-standard)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--wb-navbar-hover-bg)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'dark' ? (
              /* Sun icon — shown in dark mode to switch to light */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              /* Moon icon — shown in light mode to switch to dark */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Wallet Status */}
          {wallet ? (
            <div
              className="flex items-center gap-2 cursor-pointer"
              style={{
                padding: "var(--wb-space-8) var(--wb-space-12)",
                background: "rgba(24, 195, 126, 0.10)",
                border: "1px solid rgba(24, 195, 126, 0.22)",
                borderRadius: "var(--wb-radius-md)",
                transition: "transform var(--wb-duration-fast) var(--wb-ease-spring)",
              }}
              onClick={disconnectWallet}
              title="Click to disconnect"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: "var(--wb-color-success)",
                  boxShadow: "0 0 8px var(--wb-color-success)",
                }}
              />
              <span
                className="text-sm font-medium"
                style={{ fontFamily: "var(--wb-font-mono)", color: "var(--wb-color-success)" }}
              >
                {displayName}
              </span>
            </div>
          ) : (
            <button
              id="navbar-connect-wallet"
              className="btn-primary text-sm"
              onClick={connectWallet}
              disabled={signingIn}
            >
              {signingIn ? "Signing…" : "Connect Wallet"}
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          className="lg:hidden p-2 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            color: "var(--wb-color-text-primary)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="lg:hidden px-6 py-4 space-y-1 glass"
          style={{ borderTop: "1px solid var(--wb-color-border)" }}
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg text-sm font-medium"
                style={{
                  padding: "var(--wb-space-12) var(--wb-space-16)",
                  color: active ? "var(--wb-color-primary)" : "var(--wb-color-text-primary)",
                  background: active ? "var(--wb-navbar-active-bg)" : "transparent",
                  transition: "background var(--wb-duration-fast) var(--wb-ease-standard)",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <div style={{ paddingTop: "var(--wb-space-8)" }}>
            {wallet ? (
              <div
                className="flex items-center gap-2 cursor-pointer rounded-lg"
                style={{
                  padding: "var(--wb-space-12) var(--wb-space-16)",
                  background: "rgba(24, 195, 126, 0.10)",
                }}
                onClick={disconnectWallet}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--wb-color-success)" }} />
                <span className="text-sm font-medium" style={{ fontFamily: "var(--wb-font-mono)", color: "var(--wb-color-success)" }}>
                  {displayName}
                </span>
              </div>
            ) : (
              <button
                className="w-full btn-primary"
                style={{ borderRadius: "var(--wb-radius-md)" }}
                onClick={connectWallet}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
