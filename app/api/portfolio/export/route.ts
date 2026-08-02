import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { portfolioHistorySchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = portfolioHistorySchema.safeParse({
      wallet: searchParams.get("wallet"),
      limit: undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const walletAddress = parsed.data.wallet.toLowerCase();
    const latest = await prisma.portfolioScan.findFirst({
      where: { walletAddress },
      orderBy: { createdAt: "desc" },
      select: {
        walletAddress: true,
        totalTokens: true,
        healthScore: true,
        riskScore: true,
        snapshot: true,
        createdAt: true,
      },
    });

    if (!latest) {
      return NextResponse.json(
        { error: "No portfolio scan found for this wallet. Run a scan first." },
        { status: 404 },
      );
    }

    let holdings: { address: string; symbol: string; name?: string; usdValue: number; trustScore: number; riskLevel?: string; allocation?: number }[] = [];
    try {
      holdings = JSON.parse(latest.snapshot);
    } catch {
      holdings = [];
    }

    const totalValue = holdings.reduce((sum, h) => sum + (h.usdValue || 0), 0);

    const rows: string[] = [
      "Symbol,Name,Address,Value USD,Share %,Trust Score,Risk Level",
      ...holdings.map((h) => {
        const share = h.allocation ?? (totalValue > 0 ? ((h.usdValue || 0) / totalValue) * 100 : 0);
        return [
          escapeCsv(h.symbol),
          escapeCsv(h.name ?? ""),
          h.address,
          (h.usdValue || 0).toFixed(2),
          share.toFixed(2),
          h.trustScore,
          escapeCsv(h.riskLevel ?? ""),
        ].join(",");
      }),
      "",
      `Portfolio Health Score,${latest.healthScore}`,
      `Portfolio Risk Score,${latest.riskScore}`,
      `Total Tokens,${latest.totalTokens}`,
      `Total Value USD,${totalValue.toFixed(2)}`,
      `Generated,${new Date(latest.createdAt).toISOString()}`,
    ];

    const csv = rows.join("\n");
    const filename = `waveblock-portfolio-${walletAddress.slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Portfolio export error:", err);
    return NextResponse.json({ error: "Failed to export portfolio" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  const safe = String(value ?? "");
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
