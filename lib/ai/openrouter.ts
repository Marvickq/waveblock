import { getConfig } from "./config";

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

interface LogEntry {
  model: string;
  latencyMs: number;
  tokenUsage?: { prompt: number; completion: number; total: number };
  error?: string;
  retryAttempt?: number;
}

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(entry: LogEntry): void {
  const parts = [`[OpenRouter] model=${entry.model}`, `latency=${entry.latencyMs}ms`];
  if (entry.tokenUsage) {
    parts.push(`tokens=${entry.tokenUsage.total} (${entry.tokenUsage.prompt}+${entry.tokenUsage.completion})`);
  }
  if (entry.retryAttempt !== undefined) {
    parts.push(`retry=${entry.retryAttempt}`);
  }
  if (entry.error) {
    parts.push(`error=${entry.error}`);
  }
  console.log(parts.join(" | "));
}

function shouldRetry(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504 || status === 408;
}

function classifyError(status: number): string {
  switch (status) {
    case 401: return "Unauthorized — check OPENROUTER_API_KEY";
    case 403: return "Forbidden — API key lacks access";
    case 404: return "Not found — model may be unavailable";
    case 408: return "Request timeout";
    case 429: return "Rate limited";
    case 500: return "OpenRouter internal error";
    case 502: return "Bad gateway";
    case 503: return "Service unavailable";
    case 504: return "Gateway timeout";
    default:  return `HTTP ${status}`;
  }
}

async function attemptCompletion(
  body: Record<string, unknown>,
  config: ReturnType<typeof getConfig>,
): Promise<{ content: string; usage?: { prompt: number; completion: number; total: number } }> {
  const url = `${config.baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "WaveBlock",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const message = classifyError(response.status);
    throw new OpenRouterError(
      `${message}: ${errorText || response.statusText}`,
      response.status,
    );
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const content: string = choice?.message?.content ?? "";
  const usage = data.usage
    ? {
        prompt: data.usage.prompt_tokens as number,
        completion: data.usage.completion_tokens as number,
        total: data.usage.total_tokens as number,
      }
    : undefined;

  return { content, usage };
}

export async function createCompletion(
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "json_object" | "text";
  },
): Promise<{ content: string; usage?: { prompt: number; completion: number; total: number } }> {
  const config = getConfig();
  const startTime = Date.now();

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [{ role: "user", content: prompt }],
  };

  if (options?.temperature !== undefined) body.temperature = options.temperature;
  if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens;
  if (options?.responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  let lastError: OpenRouterError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await attemptCompletion(body, config);

      const latencyMs = Date.now() - startTime;
      log({ model: config.model, latencyMs, tokenUsage: result.usage });

      return result;
    } catch (err) {
      lastError = err instanceof OpenRouterError ? err : new OpenRouterError(String(err));

      if (attempt < MAX_RETRIES && shouldRetry(lastError.status ?? 0)) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        log({
          model: config.model,
          latencyMs: Date.now() - startTime,
          retryAttempt: attempt + 1,
          error: lastError.message,
        });
        await sleep(delay);
        continue;
      }

      log({
        model: config.model,
        latencyMs: Date.now() - startTime,
        error: lastError.message,
      });

      throw lastError;
    }
  }

  throw lastError ?? new OpenRouterError("Max retries exceeded");
}
