import { NextRequest, NextResponse } from "next/server";
import { addressSchema } from "@/lib/validation";
import { fetchTokenUsdPrice } from "@/lib/security/dexscreener";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 });
    }

    const priceUsd = await fetchTokenUsdPrice(1, parsed.data.toLowerCase());
    if (priceUsd <= 0) {
      return NextResponse.json({ error: "Price unavailable for token", priceUsd: 0 }, { status: 404 });
    }

    return NextResponse.json({ address: parsed.data.toLowerCase(), priceUsd });
  } catch (err) {
    console.error("Price lookup error:", err);
    return NextResponse.json({ error: "Price lookup failed" }, { status: 500 });
  }
}
