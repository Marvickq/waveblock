import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getProvider } from "@/lib/ethers";
import { prisma } from "@/lib/prisma";
import { cacheOrFetch } from "@/lib/cache";

const CACHE_TTL = 60_000; // 1 minute

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "10", 10) || 10, 1), 50);

    const provider = getProvider();

    const [gasPromise, trendingPromise, recentAnalyses, marketPromise, safeRiskyPromise, rugPullPromise, whalePromise] = await Promise.allSettled([
      cacheOrFetch("intel:gas", CACHE_TTL, () => fetchGasPrice(provider)),
      cacheOrFetch("intel:trending", CACHE_TTL, () => fetchTrendingTokens()),
      prisma.analysis.findMany({
        include: { trustReport: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      cacheOrFetch("intel:market", CACHE_TTL, () => fetchMarketSnapshots(limit)),
      fetchSafeRiskyFromDb(limit),
      fetchRecentRugPulls(limit),
      cacheOrFetch("intel:whale", CACHE_TTL, () => fetchWhaleActivity(provider)),
    ]);

    const gasPrice = gasPromise.status === "fulfilled" ? gasPromise.value : null;
    const trending = trendingPromise.status === "fulfilled" ? trendingPromise.value : [];
    const market = marketPromise.status === "fulfilled" ? marketPromise.value : [];
    const recent = recentAnalyses.status === "fulfilled" ? recentAnalyses.value : [];
    const { safe = [], risky = [] } = safeRiskyPromise.status === "fulfilled" ? safeRiskyPromise.value : {};
    const rugPulls = rugPullPromise.status === "fulfilled" ? rugPullPromise.value : [];
    const whaleActivity = whalePromise.status === "fulfilled" ? whalePromise.value : [];

    return NextResponse.json({
      network: {
        gasPriceGwei: gasPrice,
        chain: "Ethereum Mainnet",
        chainId: 1,
      },
      trending,
      trendingSafe: safe,
      trendingRisky: risky,
      recentRugPulls: rugPulls,
      whaleActivity,
      market,
      recentAnalyses: recent.map((a) => ({
        id: a.id,
        tokenAddress: a.tokenAddress,
        tokenName: a.tokenName,
        tokenSymbol: a.tokenSymbol,
        riskLevel: a.trustReport?.riskLevel ?? null,
        trustScore: a.trustReport?.trustScore ?? null,
        createdAt: a.createdAt,
      })),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Intelligence error:", err);
    return NextResponse.json({ error: "Failed to fetch intelligence data" }, { status: 500 });
  }
}

async function fetchGasPrice(provider: any): Promise<number | null> {
  try {
    const feeData = await provider.getFeeData();
    if (feeData.gasPrice) {
      return Math.round((Number(feeData.gasPrice) / 1e9) * 100) / 100;
    }
    return null;
  } catch {
    return null;
  }
}

interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
  liquidityUsd: number;
  priceChange24h: number;
  chain: string;
  dex: string;
  pairAddress: string;
  url: string;
}

async function fetchTrendingTokens(): Promise<TrendingToken[]> {
  try {
    const res = await fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return [];
    const profiles = await res.json();
    if (!Array.isArray(profiles)) return [];

    const preferEth = profiles.some((p: any) => p.chainId === "ethereum");
    const addressSource = preferEth
      ? profiles.filter((p: any) => p.chainId === "ethereum")
      : profiles;
    const addresses = addressSource.slice(0, 8).map((p: any) => p.tokenAddress);

    if (addresses.length === 0) return [];

    const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses.join(",")}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!pairsRes.ok) return [];

    const pairData = await pairsRes.json();
    if (!Array.isArray(pairData.pairs)) return [];

    const allowedChains = preferEth ? new Set(["ethereum"]) : new Set(["solana", "bsc", "base", "arbitrum", "polygon"]);
    const seen = new Set<string>();
    const result: TrendingToken[] = [];
    for (const p of pairData.pairs) {
      const addr = p.baseToken?.address?.toLowerCase();
      if (!addr || seen.has(addr) || !allowedChains.has(p.chainId)) continue;
      seen.add(addr);
      result.push({
        address: addr,
        symbol: p.baseToken?.symbol ?? "???",
        name: p.baseToken?.name ?? "Unknown",
        priceUsd: parseFloat(p.priceUsd) || 0,
        volume24h: p.volume?.h24 ?? 0,
        liquidityUsd: p.liquidity?.usd ?? 0,
        priceChange24h: p.priceChange?.h24 ?? 0,
        chain: p.chainId,
        dex: p.dexId,
        pairAddress: p.pairAddress,
        url: p.url,
      });
      if (result.length >= 8) break;
    }
    return result;
  } catch {
    return [];
  }
}

interface MarketSnapshot {
  address: string;
  symbol: string;
  priceUsd: number;
  volume24h: number;
  liquidityUsd: number;
  priceChange24h: number;
  marketCap: number;
}

async function fetchMarketSnapshots(limit: number): Promise<MarketSnapshot[]> {
  try {
    const res = await fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return [];
    const profiles = await res.json();
    if (!Array.isArray(profiles)) return [];

    const addresses = profiles.slice(0, 20).map((p: any) => p.tokenAddress);
    if (addresses.length === 0) return [];

    const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses.join(",")}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!pairsRes.ok) return [];

    const pairData = await pairsRes.json();
    if (!Array.isArray(pairData.pairs)) return [];

    const bestByToken = new Map<string, any>();
    for (const p of pairData.pairs) {
      const addr = p.baseToken?.address?.toLowerCase();
      if (!addr) continue;
      const existing = bestByToken.get(addr);
      if (!existing || (p.liquidity?.usd ?? 0) > (existing.liquidity?.usd ?? 0)) {
        bestByToken.set(addr, p);
      }
    }

    return Array.from(bestByToken.values())
      .sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))
      .slice(0, limit)
      .map((p) => ({
        address: p.baseToken.address.toLowerCase(),
        symbol: p.baseToken.symbol ?? "???",
        priceUsd: parseFloat(p.priceUsd) || 0,
        volume24h: p.volume?.h24 ?? 0,
        liquidityUsd: p.liquidity?.usd ?? 0,
        priceChange24h: p.priceChange?.h24 ?? 0,
        marketCap: p.marketCap ?? 0,
      }));
  } catch {
    return [];
  }
}

interface SafeRiskyToken {
  address: string;
  name: string;
  symbol: string;
  trustScore: number;
  riskLevel: string;
  createdAt: Date;
}

async function fetchSafeRiskyFromDb(limit: number): Promise<{ safe: SafeRiskyToken[]; risky: SafeRiskyToken[] }> {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { trustReport: { isNot: null } },
      include: { trustReport: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const mapped = analyses
      .filter((a) => a.trustReport)
      .map((a) => ({
        address: a.tokenAddress,
        name: a.tokenName || "Unknown",
        symbol: a.tokenSymbol || "???",
        trustScore: a.trustReport!.trustScore,
        riskLevel: a.trustReport!.riskLevel,
        createdAt: a.createdAt,
      }));

    const safe = mapped
      .filter((t) => t.trustScore >= 75 && t.riskLevel === "Low")
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, limit);

    const risky = mapped
      .filter((t) => t.riskLevel === "High" || t.riskLevel === "Critical" || t.trustScore < 40)
      .sort((a, b) => a.trustScore - b.trustScore)
      .slice(0, limit);

    return { safe, risky };
  } catch {
    return { safe: [], risky: [] };
  }
}

interface RugPullSignal {
  address: string;
  name: string;
  symbol: string;
  trustScore: number;
  riskLevel: string;
  signals: string[];
  createdAt: Date;
}

async function fetchRecentRugPulls(limit: number): Promise<RugPullSignal[]> {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { trustReport: { isNot: null } },
      include: { trustReport: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const signals: RugPullSignal[] = [];
    for (const a of analyses) {
      if (!a.trustReport) continue;
      const report = a.trustReport;
      const flags: string[] = [];
      if (report.riskLevel === "Critical") flags.push("Critical risk score");
      if (report.riskLevel === "High") flags.push("High risk score");
      const scamLower = report.scamRisk.toLowerCase();
      if (scamLower.includes("honeypot")) flags.push("Honeypot indication");
      if (scamLower.includes("rug")) flags.push("Rug-pull indication");
      if (report.contractRisks.toLowerCase().includes("mint")) flags.push("Mintable contract");
      if (flags.length === 0) continue;
      signals.push({
        address: a.tokenAddress,
        name: a.tokenName || "Unknown",
        symbol: a.tokenSymbol || "???",
        trustScore: report.trustScore,
        riskLevel: report.riskLevel,
        signals: flags.slice(0, 3),
        createdAt: a.createdAt,
      });
    }
    return signals.slice(0, limit);
  } catch {
    return [];
  }
}

interface WhaleTransfer {
  txHash: string;
  from: string;
  to: string;
  valueEth: number;
  blockNumber: number;
  timestamp: Date | null;
  explorerUrl: string;
}

async function fetchWhaleActivity(provider: any): Promise<WhaleTransfer[]> {
  try {
    const current = await provider.getBlockNumber();
    const threshold = ethers.parseEther("50");
    const result: WhaleTransfer[] = [];

    for (let bn = current; bn > current - 5 && bn > 0; bn--) {
      const block = await provider.getBlock(bn, true);
      if (!block) continue;
      for (const tx of block.transactions || []) {
        if (!tx.value || BigInt(tx.value) < threshold) continue;
        const valueEth = Number(ethers.formatEther(tx.value));
        if (valueEth < 50) continue;
        result.push({
          txHash: tx.hash,
          from: tx.from,
          to: tx.to || "0x0000000000000000000000000000000000000000",
          valueEth: Math.round(valueEth * 100) / 100,
          blockNumber: bn,
          timestamp: block.timestamp ? new Date(block.timestamp * 1000) : null,
          explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
        });
        if (result.length >= 10) break;
      }
      if (result.length >= 10) break;
    }

    return result.sort((a, b) => b.valueEth - a.valueEth).slice(0, 10);
  } catch {
    return [];
  }
}
