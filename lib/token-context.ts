import { prisma } from "@/lib/prisma";
import { analyseTokenSecurity } from "@/lib/security";

export interface TokenContextData {
  address: string;
  name: string;
  symbol: string;
  trustScore: number | null;
  riskLevel: string | null;
  source: "stored-analysis" | "live-security" | "unavailable";
  live: {
    liquidityUSD: number | null;
    holderCount: number | null;
    buyTax: number | null;
    sellTax: number | null;
    isHoneypot: boolean | null;
    isMintable: boolean | null;
    canBlacklist: boolean | null;
    canPause: boolean | null;
    isProxy: boolean | null;
    contractRisks?: string | null;
    aiSummary?: string | null;
  };
}

/**
 * Build real, verified context about a token. Prefers the latest stored AI
 * analysis (which itself is grounded in on-chain + GoPlus data), falling back
 * to a live security scan. Never fabricates numbers.
 */
export async function getTokenContext(chainId: number, address: string): Promise<TokenContextData> {
  const addr = address.toLowerCase();

  const analysis = await prisma.analysis.findFirst({
    where: { tokenAddress: addr },
    orderBy: { createdAt: "desc" },
    include: { trustReport: true },
  });

  if (analysis?.trustReport) {
    const t = analysis.trustReport;
    return {
      address: addr,
      name: analysis.tokenName || "Unknown",
      symbol: analysis.tokenSymbol || "???",
      trustScore: t.trustScore,
      riskLevel: t.riskLevel,
      source: "stored-analysis",
      live: {
        liquidityUSD: null,
        holderCount: null,
        buyTax: null,
        sellTax: null,
        isHoneypot: null,
        isMintable: null,
        canBlacklist: null,
        canPause: null,
        isProxy: null,
        contractRisks: t.contractRisks,
        aiSummary: t.aiSummary,
      },
    };
  }

  try {
    const security = await analyseTokenSecurity(chainId, addr);
    const { goPlus, liquidityUSD, holders } = security;
    return {
      address: addr,
      name: "Unknown",
      symbol: "???",
      trustScore: null,
      riskLevel: null,
      source: "live-security",
      live: {
        liquidityUSD,
        holderCount: holders.holderCount ?? goPlus.holderCount,
        buyTax: goPlus.buyTax,
        sellTax: goPlus.sellTax,
        isHoneypot: goPlus.isHoneypot,
        isMintable: goPlus.isMintable,
        canBlacklist: goPlus.canBlacklist,
        canPause: goPlus.canPause,
        isProxy: goPlus.isProxy,
      },
    };
  } catch {
    return {
      address: addr,
      name: "Unknown",
      symbol: "???",
      trustScore: null,
      riskLevel: null,
      source: "unavailable",
      live: {
        liquidityUSD: null,
        holderCount: null,
        buyTax: null,
        sellTax: null,
        isHoneypot: null,
        isMintable: null,
        canBlacklist: null,
        canPause: null,
        isProxy: null,
      },
    };
  }
}

export function formatTokenContext(data: TokenContextData, label?: string): string {
  const heading = label ? `Token ${label}` : "Token";
  const live = data.live;
  const lines = [
    `${heading} (${data.address})`,
    `Name: ${data.name}`,
    `Symbol: ${data.symbol}`,
    data.trustScore != null ? `Trust Score: ${data.trustScore}/100` : null,
    data.riskLevel ? `Risk Level: ${data.riskLevel}` : null,
    live.liquidityUSD != null ? `Liquidity USD: $${live.liquidityUSD.toLocaleString()}` : null,
    live.holderCount != null ? `Holder Count: ${live.holderCount.toLocaleString()}` : null,
    live.buyTax != null ? `Buy Tax: ${live.buyTax}%` : null,
    live.sellTax != null ? `Sell Tax: ${live.sellTax}%` : null,
    live.isHoneypot != null ? `Is Honeypot: ${live.isHoneypot ? "Yes" : "No"}` : null,
    live.isMintable != null ? `Is Mintable: ${live.isMintable ? "Yes" : "No"}` : null,
    live.canBlacklist != null ? `Can Blacklist: ${live.canBlacklist ? "Yes" : "No"}` : null,
    live.canPause != null ? `Can Pause: ${live.canPause ? "Yes" : "No"}` : null,
    live.isProxy != null ? `Is Proxy: ${live.isProxy ? "Yes" : "No"}` : null,
  ].filter((l): l is string => l !== null);

  if (live.contractRisks) lines.push(`Contract Risks: ${live.contractRisks}`);
  if (live.aiSummary) lines.push(`AI Summary: ${live.aiSummary}`);

  return lines.join("\n");
}
