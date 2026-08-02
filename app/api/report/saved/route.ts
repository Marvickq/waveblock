import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const saved = await prisma.savedReport.findMany({
      where: { userId: session.userId },
      include: { analysis: { include: { trustReport: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      ids: saved.map((s) => s.analysisId),
      reports: saved.map((s) => ({
        savedAt: s.createdAt,
        analysis: s.analysis,
      })),
    });
  } catch (err) {
    console.error("Saved reports fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch saved reports" }, { status: 500 });
  }
}
