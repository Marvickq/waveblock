import { fetchTokenSecurity, type GoPlusTokenSecurity } from "./goplus";
import { fetchTokenPairs, type DexScreenerPair } from "./dexscreener";
import { deriveHolderInfo, type HolderInfo } from "./holders";

export interface SecurityAnalysis {
  goPlus: GoPlusTokenSecurity;
  pairs: DexScreenerPair[];
  holders: HolderInfo;
  bestPair: DexScreenerPair | null;
  liquidityUSD: number;
  marketCap: number | null;
  volume24h: number;
}

export async function analyseTokenSecurity(
  chainId: number,
  address: string,
): Promise<SecurityAnalysis> {
  const [goPlus, pairs] = await Promise.all([
    fetchTokenSecurity(chainId, address),
    fetchTokenPairs(chainId, address),
  ]);

  const holders = deriveHolderInfo(goPlus);

  const bestPair = pairs.length > 0
    ? pairs.reduce((best, p) => (p.liquidity.usd > best.liquidity.usd ? p : best), pairs[0])
    : null;

  const liquidityUSD = bestPair?.liquidity?.usd ?? 0;
  const marketCap = bestPair?.marketCap ?? null;
  const volume24h = bestPair?.volume?.h24 ?? 0;

  return {
    goPlus,
    pairs,
    holders,
    bestPair,
    liquidityUSD,
    marketCap,
    volume24h,
  };
}
