import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { registrySaveSchema } from "@/lib/validation";
import {
  canonicalReportPayload,
  computeReportHash,
  saveReportHashOnChain,
  getRegistryConfig,
  getTxExplorerUrl,
} from "@/lib/registry";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = registrySaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const config = getRegistryConfig();
    if (!config.configured) {
      return NextResponse.json(
        { error: "Trust Registry is not configured. Set REGISTRY_CONTRACT_ADDRESS and ADMIN_PRIVATE_KEY.", configured: false },
        { status: 503 },
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: parsed.data.analysisId },
      include: { trustReport: true },
    });

    if (!analysis?.trustReport) {
      return NextResponse.json({ error: "Analysis or trust report not found" }, { status: 404 });
    }

    const report = analysis.trustReport;
    if (report.txHash) {
      return NextResponse.json({
        error: "This report is already registered on-chain",
        txHash: report.txHash,
        blockNumber: report.blockNumber,
        explorerUrl: getTxExplorerUrl(report.txHash),
      }, { status: 409 });
    }

    const reportHash = computeReportHash(
      canonicalReportPayload({
        analysisId: analysis.id,
        tokenAddress: analysis.tokenAddress,
        trustScore: report.trustScore,
        riskLevel: report.riskLevel,
        scamRisk: report.scamRisk,
        liquidityStatus: report.liquidityStatus,
        ownershipRisk: report.ownershipRisk,
        holderConcentration: report.holderConcentration,
        contractRisks: report.contractRisks,
        aiSummary: report.aiSummary,
      }),
    );

    const result = await saveReportHashOnChain(analysis.tokenAddress, reportHash);
    if (!result.ok || !result.txHash) {
      return NextResponse.json(
        { error: result.error || "Failed to submit report hash to the registry", configured: true },
        { status: 500 },
      );
    }

    await prisma.trustReport.update({
      where: { id: report.id },
      data: {
        reportHash,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        blockTimestamp: result.blockTimestamp,
        registryId: result.registryId,
        verified: true,
      },
    });

    return NextResponse.json({
      ok: true,
      reportHash,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      blockTimestamp: result.blockTimestamp,
      registryId: result.registryId,
      explorerUrl: getTxExplorerUrl(result.txHash),
    });
  } catch (err) {
    console.error("Registry save error:", err);
    return NextResponse.json({ error: "Failed to register report hash" }, { status: 500 });
  }
}
