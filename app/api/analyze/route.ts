import { NextRequest, NextResponse } from "next/server";
import { analyzeToken } from "@/lib/analysis";
import { addressSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canonicalReportPayload, computeReportHash } from "@/lib/registry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = addressSchema.safeParse(body.address);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 });
    }

    const address = parsed.data.toLowerCase();
    const session = await getSession();

    const { tokenAnalysis, aiOutput } = await analyzeToken(address);

    const reportHash = computeReportHash(
      canonicalReportPayload({
        analysisId: "pending",
        tokenAddress: address,
        trustScore: aiOutput.trustScore,
        riskLevel: aiOutput.riskLevel,
        scamRisk: aiOutput.scamRisk,
        liquidityStatus: aiOutput.liquidityStatus,
        ownershipRisk: aiOutput.ownershipRisk,
        holderConcentration: aiOutput.holderConcentration,
        contractRisks: aiOutput.contractRisks,
        aiSummary: aiOutput.aiSummary,
      }),
    );

    const analysis = await prisma.analysis.create({
      data: {
        tokenAddress: address,
        tokenName: tokenAnalysis.name,
        tokenSymbol: tokenAnalysis.symbol,
        tokenDecimals: tokenAnalysis.decimals ?? null,
        totalSupply: tokenAnalysis.totalSupply ?? null,
        owner: tokenAnalysis.owner ?? null,
        verified: tokenAnalysis.verified ?? null,
        chainId: tokenAnalysis.chainId ?? null,
        blockNumber: tokenAnalysis.blockNumber ?? null,
        userId: session?.userId ?? null,
        trustReport: {
          create: {
            trustScore: aiOutput.trustScore,
            riskLevel: aiOutput.riskLevel,
            scamRisk: aiOutput.scamRisk,
            liquidityStatus: aiOutput.liquidityStatus,
            ownershipRisk: aiOutput.ownershipRisk,
            holderConcentration: aiOutput.holderConcentration,
            contractRisks: aiOutput.contractRisks,
            aiSummary: aiOutput.aiSummary,
            reportHash,
          },
        },
      },
      include: { trustReport: true },
    });

    if (analysis.trustReport) {
      const finalHash = computeReportHash(
        canonicalReportPayload({
          analysisId: analysis.id,
          tokenAddress: address,
          trustScore: aiOutput.trustScore,
          riskLevel: aiOutput.riskLevel,
          scamRisk: aiOutput.scamRisk,
          liquidityStatus: aiOutput.liquidityStatus,
          ownershipRisk: aiOutput.ownershipRisk,
          holderConcentration: aiOutput.holderConcentration,
          contractRisks: aiOutput.contractRisks,
          aiSummary: aiOutput.aiSummary,
        }),
      );
      await prisma.trustReport.update({
        where: { id: analysis.trustReport.id },
        data: { reportHash: finalHash },
      });
    }

    return NextResponse.json({
      analysisId: analysis.id,
      ...tokenAnalysis,
    });
  } catch (err: any) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: err.message || "Analysis failed" }, { status: 500 });
  }
}
