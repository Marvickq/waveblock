import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyReportHashOnChain, getRegistryConfig, getTxExplorerUrl } from "@/lib/registry";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportHash = searchParams.get("reportHash");
    const analysisId = searchParams.get("analysisId");

    const config = getRegistryConfig();
    if (!config.contractAddress) {
      return NextResponse.json(
        { error: "Trust Registry is not configured. Set REGISTRY_CONTRACT_ADDRESS.", configured: false },
        { status: 503 },
      );
    }

    let hash = reportHash ?? null;
    let dbReport = null;

    if (analysisId) {
      dbReport = await prisma.trustReport.findFirst({
        where: { analysisId },
        include: { analysis: true },
      });
      if (!dbReport) {
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
      }
      hash = dbReport.reportHash ?? null;
    }

    if (!hash) {
      return NextResponse.json({ error: "reportHash (or analysisId with a stored hash) is required" }, { status: 400 });
    }

    const result = await verifyReportHashOnChain(hash);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "On-chain verification failed", configured: true },
        { status: 500 },
      );
    }

    return NextResponse.json({
      configured: true,
      reportHash: hash,
      exists: result.exists,
      registryId: result.registryId,
      timestamp: result.timestamp,
      tokenAddress: result.tokenAddress,
      verified: result.exists,
      status: result.exists ? "VERIFIED" : "NOT_FOUND",
      storedLocally: Boolean(dbReport),
      localRecord: dbReport
        ? {
            trustScore: dbReport.trustScore,
            riskLevel: dbReport.riskLevel,
            txHash: dbReport.txHash,
            blockNumber: dbReport.blockNumber,
            blockTimestamp: dbReport.blockTimestamp,
            explorerUrl: dbReport.txHash ? getTxExplorerUrl(dbReport.txHash) : null,
            createdAt: dbReport.createdAt,
          }
        : null,
    });
  } catch (err) {
    console.error("Registry verify error:", err);
    return NextResponse.json({ error: "Failed to verify report hash" }, { status: 500 });
  }
}
