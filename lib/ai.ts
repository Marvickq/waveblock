import { createCompletion } from "./ai/openrouter";

export interface AIAnalysisInput {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  totalSupply: string;
  owner: string | null;
  verified: boolean;
  chainId: number;
}

export interface AIAnalysisOutput {
  trustScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  scamRisk: string;
  liquidityStatus: string;
  ownershipRisk: string;
  holderConcentration: string;
  contractRisks: string;
  aiSummary: string;
}

export async function generateAIAnalysis(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
  const prompt = `You are WaveBlock AI, a blockchain security analyst. Analyse this ERC-20 token and return ONLY valid JSON.

Token: ${input.tokenName} (${input.tokenSymbol})
Address: ${input.tokenAddress}
Chain ID: ${input.chainId}
Decimals: ${input.decimals}
Total Supply: ${input.totalSupply}
Owner: ${input.owner || "Unknown / Not found"}
Contract Verified: ${input.verified ? "Yes" : "No"}

Return JSON with exactly these fields:
{
  "trustScore": <0-100 integer>,
  "riskLevel": "<Low|Medium|High|Critical>",
  "scamRisk": "<brief analysis of scam/honeypot risk>",
  "liquidityStatus": "<analysis of liquidity risk>",
  "ownershipRisk": "<analysis of centralisation/ownership risk>",
  "holderConcentration": "<analysis of holder distribution risk>",
  "contractRisks": "<analysis of contract-level risks like hidden functions, taxes, etc.>",
  "aiSummary": "<2-3 sentence plain-English summary of the overall risk assessment>"
}

Rules:
- trustScore 0-100: 80+ Safe, 60-79 Caution, 40-59 Risky, <40 Critical
- If owner is null or zero address, ownershipRenounced = true (low risk)
- If contract is unverified, it's higher risk
- Consider known scam indicators
- Be objective and data-driven
- Keep summaries concise and actionable`;

  const { content } = await createCompletion(prompt, {
    temperature: 0.3,
    maxTokens: 1000,
    responseFormat: "json_object",
  });

  if (!content) throw new Error("Empty AI response");

  const parsed = JSON.parse(content) as AIAnalysisOutput;

  return {
    trustScore: Math.max(0, Math.min(100, parsed.trustScore)),
    riskLevel: parsed.riskLevel || "Medium",
    scamRisk: parsed.scamRisk || "",
    liquidityStatus: parsed.liquidityStatus || "",
    ownershipRisk: parsed.ownershipRisk || "",
    holderConcentration: parsed.holderConcentration || "",
    contractRisks: parsed.contractRisks || "",
    aiSummary: parsed.aiSummary || "",
  };
}
