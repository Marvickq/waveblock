import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, address: session.address, userId: session.userId });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
