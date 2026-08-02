import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [analyses, users, wallets] = await Promise.all([
      prisma.analysis.count(),
      prisma.user.count(),
      prisma.wallet.count(),
    ]);

    return NextResponse.json({
      tokensAnalysed: analyses,
      usersProtected: users,
      walletsConnected: wallets,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ tokensAnalysed: 0, usersProtected: 0, walletsConnected: 0 }, { status: 200 });
  }
}
