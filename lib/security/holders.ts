import type { GoPlusTokenSecurity } from "./goplus";

export interface HolderInfo {
  holderCount: number | null;
  topHolders: { address: string; percentage: number }[];
  top10Percent: number | null;
  devWalletPercent: number | null;
}

/**
 * Derive holder information from GoPlus security data.
 *
 * Etherscan's tokenholderlist endpoint was deprecated and moved behind the
 * paid API Pro tier, so we rely on GoPlus (already fetched by
 * analyseTokenSecurity) for holder count and dev-wallet concentration.
 */
export function deriveHolderInfo(goPlus: GoPlusTokenSecurity): HolderInfo {
  let devWalletPercent: number | null = null;

  const totalSupply = goPlus.totalSupply ? parseFloat(goPlus.totalSupply) : null;
  const ownerBalance = goPlus.ownerBalance ? parseFloat(goPlus.ownerBalance) : null;
  if (totalSupply && totalSupply > 0 && ownerBalance != null && ownerBalance >= 0) {
    devWalletPercent = Math.round((ownerBalance / totalSupply) * 10000) / 100;
  }

  return {
    holderCount: goPlus.holderCount,
    topHolders: [],
    top10Percent: null,
    devWalletPercent,
  };
}
