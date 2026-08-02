import { ethers } from "ethers";
import { fetchTokenData, getNetworkInfo, verifyContract } from "./ethers";
import { generateAIAnalysis, type AIAnalysisOutput } from "./ai";
import { analyseTokenSecurity } from "./security";
import type { TokenAnalysis, RiskLevel } from "@/types";

function computeRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "Low";
  if (score >= 60) return "Medium";
  if (score >= 40) return "High";
  return "Critical";
}

function deriveRisks(
  aiOutput: AIAnalysisOutput,
  verified: boolean,
  isHoneypot: boolean | null,
  isMintable: boolean | null,
  canBlacklist: boolean | null,
  canPause: boolean | null,
  hasExternalCall: boolean | null,
  owner: string | null,
): { label: string; severity: "low" | "medium" | "high"; note: string }[] {
  const risks: { label: string; severity: "low" | "medium" | "high"; note: string }[] = [];

  if (isHoneypot === true) {
    risks.push({ label: "Honeypot Detected", severity: "high", note: "Contract may prevent selling. Extreme caution advised." });
  }

  if (!verified) {
    risks.push({ label: "Unverified Contract", severity: "high", note: "Source code is not verified on Etherscan." });
  }

  if (isMintable === true) {
    risks.push({ label: "Mintable Token", severity: "high", note: "Owner can mint unlimited new tokens, diluting holders." });
  }

  if (canBlacklist === true) {
    risks.push({ label: "Blacklist Function", severity: "high", note: "Owner can blacklist addresses, blocking transfers." });
  }

  if (canPause === true) {
    risks.push({ label: "Pausable Transfers", severity: "medium", note: "Owner can pause all transfers at any time." });
  }

  if (hasExternalCall === true) {
    risks.push({ label: "External Call Risk", severity: "medium", note: "Contract makes external calls; potential reentrancy risk." });
  }

  if (owner && owner !== ethers.ZeroAddress) {
    risks.push({ label: "Active Ownership", severity: owner.startsWith("0x0000") ? "low" : "medium", note: `Owner ${owner.slice(0, 6)}...${owner.slice(-4)} can modify contract.` });
  }

  if (aiOutput.trustScore < 40) {
    risks.push({ label: "High Risk Score", severity: "high", note: "Multiple risk indicators detected." });
  }

  if (risks.length === 0) {
    risks.push({ label: "No Major Risks", severity: "low", note: "All security checks passed." });
  }

  return risks;
}

function deriveHolders(
  top10Percent: number | null,
  devWalletPercent: number | null,
): { label: string; pct: number; color: string }[] {
  const top10 = top10Percent ?? 30;
  const dev = devWalletPercent ?? 5;
  const lp = Math.max(0, Math.min(30, Math.round((100 - top10 - dev) * 0.35)));
  const pub = Math.max(0, 100 - top10 - dev - lp);

  return [
    { label: "Top 10 Wallets", pct: top10, color: top10 > 50 ? "#EF4444" : "#2563EB" },
    { label: "Dev Wallet", pct: dev, color: dev > 10 ? "#EF4444" : "#7C3AED" },
    { label: "Liquidity Pool", pct: lp, color: "#06B6D4" },
    { label: "Public", pct: pub, color: "#E2E8F0" },
  ];
}

export interface AnalysisResult {
  tokenAnalysis: TokenAnalysis;
  aiOutput: AIAnalysisOutput;
}

export async function analyzeToken(address: string): Promise<AnalysisResult> {
  const lowerAddr = address.toLowerCase();

  const [chainInfo, tokenData, verified, security] = await Promise.all([
    getNetworkInfo(),
    fetchTokenData(lowerAddr),
    verifyContract(lowerAddr),
    analyseTokenSecurity(1, lowerAddr),
  ]);

  const aiInput = {
    tokenAddress: lowerAddr,
    tokenName: tokenData.name,
    tokenSymbol: tokenData.symbol,
    decimals: tokenData.decimals,
    totalSupply: tokenData.totalSupply,
    owner: tokenData.owner,
    verified,
    chainId: chainInfo.chainId,
  };

  const aiOutput = await generateAIAnalysis(aiInput);

  const trustScore = aiOutput.trustScore;
  const riskLevel = computeRiskLevel(trustScore);
  const ownerRenounced = !tokenData.owner || tokenData.owner === ethers.ZeroAddress;

  const { goPlus, holders, liquidityUSD, marketCap } = security;

  const isHoneypot = goPlus.isHoneypot;
  const buyTax = goPlus.buyTax;
  const sellTax = goPlus.sellTax;
  const holderCount = holders.holderCount ?? goPlus.holderCount;
  const top10Percent = holders.top10Percent;
  const devWalletPercent = holders.devWalletPercent;

  const liquidityLocked = liquidityUSD > 0 && (
    (goPlus.lpTotalSupply !== null && goPlus.lpHolderCount !== null && goPlus.lpHolderCount > 1)
  );

  const tokenAnalysis: TokenAnalysis = {
    address: lowerAddr,
    name: tokenData.name,
    symbol: tokenData.symbol,
    trustScore,
    riskLevel,
    contractVerified: verified,
    ownershipRenounced: ownerRenounced,
    liquidityLocked: liquidityLocked || liquidityUSD > 10000,
    liquidityLockDays: liquidityLocked ? 180 : 0,
    liquidityUSD,
    isHoneypot: isHoneypot === true,
    buyTax: buyTax ?? 0,
    sellTax: sellTax ?? 0,
    holderCount: holderCount ?? 0,
    top10Percent: top10Percent ?? 0,
    devWalletPercent: devWalletPercent ?? 0,
    risks: deriveRisks(aiOutput, verified, isHoneypot, goPlus.isMintable, goPlus.canBlacklist, goPlus.canPause, goPlus.hasExternalCall, tokenData.owner),
    aiReport: aiOutput.aiSummary,
    holders: deriveHolders(top10Percent, devWalletPercent),
    chainId: chainInfo.chainId,
    totalSupply: tokenData.totalSupply,
    decimals: tokenData.decimals,
    owner: tokenData.owner,
    verified,
    blockNumber: chainInfo.blockNumber,
  };

  return { tokenAnalysis, aiOutput };
}
