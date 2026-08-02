import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Analyse any ERC-20 token contract with AI — get a Trust Score, risk breakdown, and full Trust Report in seconds.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
