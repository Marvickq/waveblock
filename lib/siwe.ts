import { SiweMessage } from "siwe";

export function createSiweMessage(address: string, nonce: string, chainId?: number): string {
  const message = new SiweMessage({
    domain: typeof window !== "undefined" ? window.location.host : "localhost:3000",
    address,
    statement: "Sign in to WaveBlock to verify your wallet ownership.",
    uri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    version: "1",
    chainId: chainId || 1,
    nonce,
  });
  return message.prepareMessage();
}

export async function verifySiweSignature(
  message: string,
  signature: string,
  nonce: string
): Promise<{ address: string; chainId: number } | null> {
  const siweMessage = new SiweMessage(message);
  const result = await siweMessage.verify({ signature, nonce });
  if (!result.success) {
    const e = result.error as { type?: string; expected?: unknown; received?: unknown } | null;
    const type = e?.type ?? "Signature verification failed";
    const received = e?.received != null ? String(e.received) : "";
    throw new Error(received ? `${type} (got: ${received})` : type);
  }
  return {
    address: result.data.address,
    chainId: result.data.chainId ?? 1,
  };
}

export function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
