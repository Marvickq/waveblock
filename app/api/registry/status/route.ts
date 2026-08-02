import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegistryConfig, getRegistryContract } from "@/lib/registry";

export async function GET() {
  try {
    const config = getRegistryConfig();
    const [registeredCount, contractData] = await Promise.all([
      prisma.trustReport.count({ where: { txHash: { not: null } } }),
      fetchOnChainStatus(),
    ]);

    return NextResponse.json({
      configured: config.configured,
      contractAddress: config.contractAddress,
      adminWallet: config.adminWallet,
      chainId: config.chainId,
      explorerUrl: config.explorerUrl,
      onChainReportCount: contractData?.reportCount ?? null,
      registeredLocally: registeredCount,
    });
  } catch (err) {
    console.error("Registry status error:", err);
    return NextResponse.json({ error: "Failed to load registry status" }, { status: 500 });
  }
}

async function fetchOnChainStatus(): Promise<{ reportCount: string | null; owner: string | null } | null> {
  const contract = getRegistryContract(null);
  if (!contract) return null;
  try {
    const [count, owner] = await Promise.all([
      contract.reportCount(),
      contract.owner(),
    ]);
    return { reportCount: count ? count.toString() : "0", owner: owner ?? null };
  } catch {
    return null;
  }
}
