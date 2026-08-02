import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { generateNonce } from "@/lib/siwe";

const SECRET = new TextEncoder().encode(
  (() => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("NEXTAUTH_SECRET must be at least 32 characters");
    }
    return secret;
  })()
);

const COOKIE_NAME = "wb_nonce";

export async function createPendingNonce(): Promise<{ nonce: string; id: string }> {
  const nonce = generateNonce();
  const id = crypto.randomUUID();
  const token = await new SignJWT({ nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60,
    path: "/",
  });

  return { nonce, id };
}

export async function consumeNonce(id: string): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const nonce = payload.nonce as string | undefined;
    if (!nonce) return null;
    cookieStore.delete(COOKIE_NAME);
    return nonce;
  } catch {
    return null;
  }
}
