import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";
import { analyzeSchema } from "@/lib/validation";
import { getProvider } from "@/lib/ethers";

const REGISTRY_ABI = [
  "function saveReportHash(bytes32 reportHash, string calldata tokenAddress) external returns (uint256 id)",
  "function getReportHash(uint256 id) external view returns (bytes32 reportHash, uint256 timestamp, string memory tokenAddress)",
  "function verifyReport(bytes32 reportHash) external view returns (bool exists, uint256 id)",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const { analysisId } = body;
    if (!analysisId) {
      return NextResponse.json({ error: "analysisId required" }, { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { trustReport: true },
    });

    if (!analysis || !analysis.trustReport) {
      return NextResponse.json({ error: "Analysis or report not found" }, { status: 404 });
    }

    const reportContent = JSON.stringify({
      trustScore: analysis.trustReport.trustScore,
      riskLevel: analysis.trustReport.riskLevel,
      tokenAddress: analysis.tokenAddress,
      tokenName: analysis.tokenName,
      aiSummary: analysis.trustReport.aiSummary,
    });

    const reportHash = ethers.keccak256(ethers.toUtf8Bytes(reportContent));

    const registryAddress = process.env.REGISTRY_CONTRACT_ADDRESS;
    if (!registryAddress) {
      return NextResponse.json({ error: "Registry contract not configured" }, { status: 500 });
    }

    const provider = getProvider();
    const signer = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY || ethers.ZeroHash,
      provider
    );
    const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, signer);

    const tx = await registry.saveReportHash(reportHash, analysis.tokenAddress);
    const receipt = await tx.wait();

    await prisma.trustReport.update({
      where: { id: analysis.trustReport.id },
      data: {
        reportHash: reportHash,
        verified: true,
      },
    });

    return NextResponse.json({
      verified: true,
      reportHash,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err: any) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
