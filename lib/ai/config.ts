export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getConfig(): OpenRouterConfig {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  return {
    apiKey,
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
  };
}
