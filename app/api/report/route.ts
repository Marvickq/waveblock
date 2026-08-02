import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validation";
import { getSession } from "@/lib/session";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const analysisId = searchParams.get("analysisId");
    const q = searchParams.get("q");
    const riskLevel = searchParams.get("riskLevel");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);

    const where: Prisma.AnalysisWhereInput = {};

    if (q) {
      where.OR = [
        { tokenAddress: { contains: q.toLowerCase() } },
        { tokenName: { contains: q } },
        { tokenSymbol: { contains: q } },
      ];
    }

    if (riskLevel) {
      where.trustReport = { is: { riskLevel } };
    }

    if (address) {
      const addrParsed = addressSchema.safeParse(address);
      if (!addrParsed.success) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
      }
      where.tokenAddress = addrParsed.data.toLowerCase();
    }

    if (analysisId) {
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: { trustReport: true },
      });

      if (!analysis) {
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
      }

      return NextResponse.json({ analysis });
    }

    const analyses = await prisma.analysis.findMany({
      where,
      include: { trustReport: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const total = await prisma.analysis.count({ where });

    return NextResponse.json({
      analyses,
      total,
      filters: {
        q: q ?? null,
        riskLevel: riskLevel ?? null,
        address: address?.toLowerCase() ?? null,
      },
    });
  } catch (err) {
    console.error("Report fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const analysisId = typeof body?.analysisId === "string" ? body.analysisId : null;
    if (!analysisId) {
      return NextResponse.json({ error: "analysisId is required" }, { status: 400 });
    }

    const existing = await prisma.savedReport.findUnique({
      where: { userId_analysisId: { userId: session.userId, analysisId } },
    });

    if (existing) {
      await prisma.savedReport.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false, message: "Report removed from saved" });
    }

    await prisma.savedReport.create({
      data: { userId: session.userId, analysisId },
    });
    return NextResponse.json({ saved: true, message: "Report saved" });
  } catch (err) {
    console.error("Save report error:", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
