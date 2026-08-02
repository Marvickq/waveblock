import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getProvider } from "@/lib/ethers";
import { analyseTokenSecurity } from "@/lib/security";
import { fetchTokenUsdPrice } from "@/lib/security/dexscreener";
import { addressSchema } from "@/lib/validation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const ERC20_BALANCE_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = addressSchema.safeParse(body.address);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const walletAddress = parsed.data.toLowerCase();
    const provider = getProvider();
    const etherscanKey = process.env.ETHERSCAN_API_KEY;
    let tokens: { address: string; balance: string; symbol: string; name: string; decimals: number }[] = [];

    if (etherscanKey) {
      try {
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${walletAddress}&page=1&offset=50&sort=desc&apikey=${etherscanKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();

        if (data.status === "1" && Array.isArray(data.result)) {
          const seen = new Set<string>();
          for (const tx of data.result) {
            const tokenAddr = tx.contractAddress?.toLowerCase();
            if (!tokenAddr || seen.has(tokenAddr)) continue;
            seen.add(tokenAddr);

            const symbol = tx.tokenSymbol || "???";
            const name = tx.tokenName || "Unknown";
            const decimals = parseInt(tx.tokenDecimal) || 18;

            try {
              const contract = new ethers.Contract(tokenAddr, ERC20_BALANCE_ABI, provider);
              const balance = await contract.balanceOf(walletAddress);
              if (balance > BigInt(0)) {
                tokens.push({ address: tokenAddr, balance: balance.toString(), symbol, name, decimals });
              }
            } catch {
              continue;
            }

            if (tokens.length >= 15) break;
          }
        }
      } catch {
        // Etherscan fallback — use ETH only
      }
    }

    const ethBalance = await provider.getBalance(walletAddress);
    const ethValue = Number(ethers.formatEther(ethBalance));
    const ethPrice = await fetchTokenUsdPrice(
      1,
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    );
    const ethUsd = ethValue * (ethPrice > 0 ? ethPrice : 0);

    if (ethValue > 0 || tokens.length === 0) {
      tokens.unshift({
        address: "0x0000000000000000000000000000000000000000",
        balance: ethBalance.toString(),
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
      });
    }

    if (tokens.length === 0) {
      return NextResponse.json({
        totalTokens: 0,
        portfolioHealthScore: 0,
        overallRiskScore: 100,
        highRiskHoldings: 0,
        whaleConcentration: 0,
        largestPositions: [],
        suspiciousAssets: [],
        diversificationScore: 0,
        holdings: [],
        aiSummary: "No token holdings found for this wallet.",
      });
    }

    const tokenAnalyses = await Promise.allSettled(
      tokens.map(async (t) => {
        const usdPrice = await fetchTokenUsdPrice(1, t.address).catch(() => 0);
        const rawBalance = Number(ethers.formatEther(t.balance));
        const usdValue = Math.round(rawBalance * usdPrice * 100) / 100;
        if (t.address === "0x0000000000000000000000000000000000000000") {
          return { ...t, priceUsd: usdPrice, usdValue, security: null, trustScore: 80, riskLevel: "Low" as const };
        }
        try {
          const security = await analyseTokenSecurity(1, t.address);
          const trustScore = security.goPlus.isHoneypot === true ? 10
            : security.goPlus.buyTax != null && security.goPlus.buyTax > 10 ? 30
            : security.liquidityUSD > 100000 ? 75
            : 50;

          return {
            ...t,
            priceUsd: usdPrice,
            usdValue,
            security,
            trustScore,
            riskLevel: (trustScore >= 80 ? "Low" : trustScore >= 60 ? "Medium" : trustScore >= 40 ? "High" : "Critical") as "Low" | "Medium" | "High" | "Critical",
          };
        } catch {
          return { ...t, priceUsd: usdPrice, usdValue, security: null, trustScore: 40, riskLevel: "High" as "Low" | "Medium" | "High" | "Critical" };
        }
      })
    );

    const analyzedTokens = tokenAnalyses
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);

    const totalValue = analyzedTokens.reduce((sum, t) => sum + (t.usdValue || 0), 0);
    const allocation = (usd: number) =>
      totalValue > 0 ? Math.round(((usd || 0) / totalValue) * 100) : 0;
    const sorted = [...analyzedTokens].sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
    const highRisk = analyzedTokens.filter((t) => t.riskLevel === "High" || t.riskLevel === "Critical");
    const safeTokens = analyzedTokens.filter((t) => t.riskLevel === "Low");

    const portfolioHealthScore = analyzedTokens.length === 0 ? 0
      : Math.round((safeTokens.length / analyzedTokens.length) * 50 + (1 - highRisk.length / analyzedTokens.length) * 30 + (totalValue > 1000 ? 20 : totalValue > 100 ? 10 : 5));

    const overallRiskScore = 100 - portfolioHealthScore;
    const whaleConcentration = sorted.length > 0 && totalValue > 0
      ? Math.round(((sorted[0].usdValue || 0) / totalValue) * 100)
      : 0;

    const diversificationScore = analyzedTokens.length >= 10 ? 90
      : analyzedTokens.length >= 5 ? 70
      : analyzedTokens.length >= 3 ? 50
      : analyzedTokens.length >= 1 ? 30
      : 0;

    const session = await getSession();

    try {
      await prisma.portfolioScan.create({
        data: {
          walletAddress,
          totalTokens: analyzedTokens.length,
          healthScore: Math.min(100, Math.max(0, portfolioHealthScore)),
          riskScore: Math.min(100, Math.max(0, overallRiskScore)),
          highRiskCount: highRisk.length,
          whaleConcentration,
          diversificationScore,
          aiSummary: `Portfolio contains ${analyzedTokens.length} token${analyzedTokens.length !== 1 ? "s" : ""}. ${highRisk.length > 0 ? `⚠️ ${highRisk.length} high-risk asset${highRisk.length !== 1 ? "s" : ""} detected.` : "No high-risk assets detected."} Portfolio health score: ${portfolioHealthScore}/100.`,
          snapshot: JSON.stringify(
            analyzedTokens.map((t) => ({
              address: t.address,
              symbol: t.symbol,
              name: t.name,
              usdValue: t.usdValue || 0,
              trustScore: t.trustScore,
              riskLevel: t.riskLevel,
              priceUsd: t.priceUsd || 0,
              allocation: allocation(t.usdValue),
            })),
          ),
          userId: session?.userId ?? null,
        },
      });
    } catch {
      // Non-fatal — persistence failure should not break the response
    }

    return NextResponse.json({
      totalTokens: analyzedTokens.length,
      totalValueUsd: Math.round(totalValue * 100) / 100,
      portfolioHealthScore: Math.min(100, Math.max(0, portfolioHealthScore)),
      overallRiskScore: Math.min(100, Math.max(0, overallRiskScore)),
      highRiskHoldings: highRisk.length,
      whaleConcentration,
      largestPositions: sorted.slice(0, 5).map((t) => ({
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        usdValue: t.usdValue || 0,
        percentage: totalValue > 0 ? Math.round(((t.usdValue || 0) / totalValue) * 100) : 0,
        trustScore: t.trustScore,
        riskLevel: t.riskLevel,
      })),
      suspiciousAssets: highRisk.map((t) => ({
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        reason: t.security?.goPlus?.isHoneypot === true ? "Potential honeypot"
          : t.security?.goPlus?.buyTax && t.security.goPlus.buyTax > 10 ? "High buy tax"
          : "Unverified or high risk indicators",
      })),
      diversificationScore,
      holdings: analyzedTokens.map((t) => ({
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        balance: t.balance,
        decimals: t.decimals,
        priceUsd: t.priceUsd || 0,
        usdValue: t.usdValue || 0,
        trustScore: t.trustScore,
        riskLevel: t.riskLevel,
        allocation: allocation(t.usdValue),
      })),
      aiSummary: `Portfolio contains ${analyzedTokens.length} token${analyzedTokens.length !== 1 ? "s" : ""}. ${highRisk.length > 0 ? `⚠️ ${highRisk.length} high-risk asset${highRisk.length !== 1 ? "s" : ""} detected.` : "No high-risk assets detected."} Portfolio health score: ${portfolioHealthScore}/100.`,
    });
  } catch (err: any) {
    console.error("Portfolio error:", err);
    return NextResponse.json({
      error: err.message || "Portfolio analysis failed",
      totalTokens: 0,
      totalValueUsd: 0,
      portfolioHealthScore: 0,
      overallRiskScore: 100,
      highRiskHoldings: 0,
      whaleConcentration: 0,
      largestPositions: [],
      suspiciousAssets: [],
      diversificationScore: 0,
      holdings: [],
      aiSummary: "Portfolio analysis unavailable.",
    }, { status: 200 });
  }
}
