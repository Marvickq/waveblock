import { NextRequest, NextResponse } from "next/server";
import { verifySiweSignature } from "@/lib/siwe";
import { siweVerifySchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { consumeNonce } from "@/lib/nonce-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = siweVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { message, signature } = parsed.data;
    const nonceId: string | undefined = body.nonceId;

    if (!nonceId) {
      return NextResponse.json({ error: "nonceId is required" }, { status: 400 });
    }

    const storedNonce = await consumeNonce(nonceId);
    if (!storedNonce) {
      return NextResponse.json({ error: "Nonce expired or invalid" }, { status: 400 });
    }

    let result: { address: string; chainId: number } | null;
    try {
      result = await verifySiweSignature(message, signature, storedNonce);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Signature verification failed";
      console.error("SIWE verify failed:", reason);
      return NextResponse.json({ error: reason }, { status: 401 });
    }
    if (!result) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const address = result.address.toLowerCase();

    let user = await prisma.user.findFirst({
      where: { wallets: { some: { address } } },
      include: { wallets: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          wallets: {
            create: { address, chainId: result.chainId },
          },
        },
        include: { wallets: true },
      });
    } else {
      const existingWallet = user.wallets.find((w) => w.address === address);
      if (existingWallet) {
        await prisma.wallet.update({
          where: { id: existingWallet.id },
          data: { chainId: result.chainId },
        });
      }
    }

    await createSession({ userId: user.id, address });

    return NextResponse.json({ ok: true, address });
  } catch (err) {
    console.error("Auth verify error:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
