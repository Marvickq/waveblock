const REQUIRED_VARS = [
  "OPENROUTER_API_KEY",
  "RPC_URL",
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
] as const;

const OPTIONAL_VARS = [
  "ETHERSCAN_API_KEY",
  "OPENROUTER_BASE_URL",
  "OPENROUTER_MODEL",
  "REGISTRY_CONTRACT_ADDRESS",
  "ADMIN_PRIVATE_KEY",
] as const;

export function validateEnv(): string[] {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    missing.push("NEXTAUTH_SECRET (must be at least 32 characters)");
  }

  return missing;
}

export function getEnvStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};

  for (const key of REQUIRED_VARS) {
    status[key] = !!process.env[key];
  }
  for (const key of OPTIONAL_VARS) {
    status[key] = !!process.env[key];
  }

  return status;
}
