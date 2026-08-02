import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "WaveBlock — AI-Powered Token Trust Analysis",
    template: "%s | WaveBlock",
  },
  description:
    "WaveBlock is a premium blockchain security platform that uses AI to analyse token contracts, detect rug-pull risks, and give you a Trust Score before you invest.",
  keywords: ["crypto security", "token analysis", "rug pull detector", "defi safety", "AI trust score", "blockchain security"],
  openGraph: {
    title: "WaveBlock — AI-Powered Token Trust Analysis",
    description: "Analyse any ERC-20 token contract with AI before you invest.",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F7CFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900;1,14..32,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('wb_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored || (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Navbar />
        <main style={{ paddingTop: "var(--wb-navbar-height, 64px)" }}>{children}</main>
      </body>
    </html>
  );
}
