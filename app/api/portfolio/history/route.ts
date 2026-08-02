import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { portfolioHistorySchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const parsed = portfolioHistorySchema.safeParse({
      wallet,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const { wallet: walletAddress, limit } = parsed.data;
    const scans = await prisma.portfolioScan.findMany({
      where: { walletAddress: walletAddress.toLowerCase() },
      orderBy: { createdAt: "desc" },
      take: limit ?? 30,
      select: {
        id: true,
        walletAddress: true,
        totalTokens: true,
        healthScore: true,
        riskScore: true,
        highRiskCount: true,
        whaleConcentration: true,
        diversificationScore: true,
        aiSummary: true,
        snapshot: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      wallet: walletAddress.toLowerCase(),
      scans: scans.map((s) => ({
        id: s.id,
        totalTokens: s.totalTokens,
        healthScore: s.healthScore,
        riskScore: s.riskScore,
        highRiskCount: s.highRiskCount,
        whaleConcentration: s.whaleConcentration,
        diversificationScore: s.diversificationScore,
        aiSummary: s.aiSummary,
        snapshot: parseSnapshot(s.snapshot),
        createdAt: s.createdAt,
      })),
      total: scans.length,
    });
  } catch (err) {
    console.error("Portfolio history error:", err);
    return NextResponse.json({ error: "Failed to fetch portfolio history" }, { status: 500 });
  }
}

function parseSnapshot(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
