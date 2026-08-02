import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  preferredNetwork: z.string().max(40).optional(),
  aiModel: z.string().max(80).nullable().optional(),
  emailAlerts: z.boolean().optional(),
  highRiskAlerts: z.boolean().optional(),
});

const NETWORK_LABELS: Record<string, string> = {
  ethereum: "Ethereum Mainnet",
  bsc: "BNB Smart Chain",
  polygon: "Polygon",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    });

    return NextResponse.json({
      settings,
      apiStatus: {
        openrouter: Boolean(process.env.OPENROUTER_API_KEY),
        etherscan: Boolean(process.env.ETHERSCAN_API_KEY),
        rpc: Boolean(process.env.RPC_URL),
        database: "sqlite",
      },
      networks: NETWORK_LABELS,
    });
  } catch (err) {
    console.error("Settings GET error:", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings", details: parsed.error.flatten() }, { status: 400 });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, ...parsed.data },
      update: parsed.data,
    });

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Settings PUT error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
