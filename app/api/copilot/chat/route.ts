import { NextRequest, NextResponse } from "next/server";
import { createCompletion } from "@/lib/ai/openrouter";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { copilotChatSchema } from "@/lib/validation";
import { getTokenContext, formatTokenContext } from "@/lib/token-context";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = copilotChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { message, tokenAddress, compareAddresses, conversationId: clientConversationId, conversationHistory } = parsed.data;
    const session = await getSession();

    const chainId = 1;
    let conversationId = clientConversationId ?? null;

    if (!conversationId && session?.userId) {
      conversationId = session.userId.slice(0, 16);
    }

    const contextBlocks: string[] = [];

    // Primary token context
    if (tokenAddress) {
      const ctx = await getTokenContext(chainId, tokenAddress);
      contextBlocks.push(formatTokenContext(ctx, "1"));
    }

    // Comparison tokens
    if (compareAddresses && compareAddresses.length > 0) {
      const others = compareAddresses
        .filter((a) => a.toLowerCase() !== (tokenAddress ?? "").toLowerCase())
        .slice(0, 3);
      const results = await Promise.allSettled(
        others.map((addr, i) => getTokenContext(chainId, addr).then((c) => formatTokenContext(c, String(i + 2)))),
      );
      for (const r of results) {
        if (r.status === "fulfilled") contextBlocks.push(r.value);
      }
    }

    // Wallet-aware context
    let walletContext = "";
    if (session?.address) {
      walletContext = `The connected wallet is ${session.address}. Use it only to personalise guidance; never claim it holds specific assets unless shown in provided data.\n`;
    }

    // Recover server-side history when none supplied
    let serverHistory = "";
    if (!conversationHistory && conversationId) {
      try {
        const recent = await prisma.copilotMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: 6,
        });
        if (recent.length > 0) {
          serverHistory = recent
            .reverse()
            .map((m) => `${m.role === "user" ? "User" : "WaveBlock AI"}: ${m.content}`)
            .join("\n");
        }
      } catch {}
    }

    const historyContext = conversationHistory && conversationHistory.length > 0
      ? conversationHistory
          .slice(-6)
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "WaveBlock AI"}: ${m.content}`)
          .join("\n")
      : serverHistory;

    const dataSection = contextBlocks.length > 0
      ? `Here is the real blockchain analysis data available:\n${contextBlocks.join("\n\n")}`
      : "No token data was provided for this query.";

    const systemPrompt = `You are WaveBlock AI, a blockchain security copilot. You help users understand token security risks using only real analysis data.

${dataSection}

${walletContext ? `Wallet context:\n${walletContext}` : ""}

Rules:
- ONLY answer based on the data provided above and general blockchain security knowledge
- If the data does not cover the question, say "I don't have enough data to answer that" — never invent facts, numbers, scores, or token details
- If the user asks to compare tokens and both tokens' data is provided, give a structured side-by-side comparison
- If the user asks about a token not shown above, ask them to provide the contract address
- Be concise and actionable, use plain English, explain technical terms`;

    const userPrompt = [
      systemPrompt,
      historyContext ? `Recent conversation:\n${historyContext}` : "",
      `User: ${message}`,
      "WaveBlock AI:",
    ].filter(Boolean).join("\n\n");

    const { content } = await createCompletion(userPrompt, {
      temperature: 0.5,
      maxTokens: 800,
    });

    if (!content) {
      return NextResponse.json({ response: "I'm sorry, I couldn't generate a response. Please try again." });
    }

    const response = content.trim();

    try {
      await prisma.copilotMessage.create({
        data: {
          role: "user",
          content: String(message).slice(0, 4000),
          tokenAddress: tokenAddress?.toLowerCase() ?? null,
          conversationId,
          userId: session?.userId ?? null,
        },
      });
      await prisma.copilotMessage.create({
        data: {
          role: "assistant",
          content: response.slice(0, 8000),
          tokenAddress: tokenAddress?.toLowerCase() ?? null,
          conversationId,
          userId: session?.userId ?? null,
        },
      });
    } catch {
      // Non-fatal — history persistence should not break the chat
    }

    return NextResponse.json({ response, conversationId });
  } catch (err: any) {
    console.error("Copilot chat error:", err);
    return NextResponse.json({
      response: "I encountered an error processing your request. Please try again.",
    });
  }
}
