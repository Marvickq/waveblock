export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  owner: string | null;
  verified: boolean;
  chainId: number;
  blockNumber: number | null;
}

export interface TrustReportData {
  trustScore: number;
  riskLevel: RiskLevel;
  scamRisk: string;
  liquidityStatus: string;
  ownershipRisk: string;
  holderConcentration: string;
  contractRisks: string;
  aiSummary: string;
}

export interface TokenAnalysis {
  address: string;
  name: string;
  symbol: string;
  trustScore: number;
  riskLevel: RiskLevel;
  contractVerified: boolean;
  ownershipRenounced: boolean;
  liquidityLocked: boolean;
  liquidityLockDays: number;
  liquidityUSD: number;
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  holderCount: number;
  top10Percent: number;
  devWalletPercent: number;
  risks: { label: string; severity: "low" | "medium" | "high"; note: string }[];
  aiReport: string;
  holders: { label: string; pct: number; color: string }[];
  chainId?: number;
  totalSupply?: string;
  decimals?: number;
  owner?: string | null;
  verified?: boolean;
  blockNumber?: number | null;
}
