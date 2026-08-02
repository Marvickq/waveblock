import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);

    const messages = await prisma.copilotMessage.findMany({
      where: {
        userId: session.userId,
        ...(conversationId ? { conversationId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const grouped = messages.reverse();

    return NextResponse.json({
      conversationId: conversationId ?? session.userId.slice(0, 16),
      messages: grouped.map((m) => ({
        id: m.id,
        role: m.role === "assistant" ? "ai" : m.role,
        content: m.content,
        tokenAddress: m.tokenAddress,
        createdAt: m.createdAt,
      })),
      total: grouped.length,
    });
  } catch (err) {
    console.error("Copilot history error:", err);
    return NextResponse.json({ error: "Failed to fetch conversation history" }, { status: 500 });
  }
}
