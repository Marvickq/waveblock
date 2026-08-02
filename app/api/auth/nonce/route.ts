import { NextResponse } from "next/server";
import { createPendingNonce } from "@/lib/nonce-store";

export async function GET() {
  const { nonce, id } = await createPendingNonce();
  return NextResponse.json({ nonce, id });
}
