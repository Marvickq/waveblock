export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  txns: {
    h24: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    m5: { buys: number; sells: number };
  };
}

const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex";

export async function fetchTokenUsdPrice(chainId: number, address: string): Promise<number> {
  try {
    const pairs = await fetchTokenPairs(chainId, address);
    if (pairs.length === 0) return 0;
    pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd);
    return parseFloat(pairs[0].priceUsd) || 0;
  } catch {
    return 0;
  }
}

export async function fetchTokenPairs(chainId: number, address: string): Promise<DexScreenerPair[]> {
  const chainMap: Record<number, string> = {
    1: "ethereum",
    56: "bsc",
    137: "polygon",
    42161: "arbitrum",
    10: "optimism",
    250: "fantom",
    43114: "avalanche",
  };

  const chain = chainMap[chainId] || "ethereum";

  try {
    const res = await fetch(`${DEXSCREENER_API}/search?q=${address}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.pairs) return [];

    const chainPairs = data.pairs.filter(
      (p: any) => p.chainId === chain && p.baseToken?.address?.toLowerCase() === address.toLowerCase()
    );

    if (chainPairs.length === 0) return [];

    return chainPairs.map(normalisePair);
  } catch {
    return [];
  }
}

function normalisePair(raw: any): DexScreenerPair {
  return {
    chainId: raw.chainId,
    dexId: raw.dexId,
    url: raw.url,
    pairAddress: raw.pairAddress,
    baseToken: raw.baseToken,
    quoteToken: raw.quoteToken,
    priceNative: raw.priceNative,
    priceUsd: raw.priceUsd || "0",
    liquidity: {
      usd: raw.liquidity?.usd ?? 0,
      base: raw.liquidity?.base ?? 0,
      quote: raw.liquidity?.quote ?? 0,
    },
    fdv: raw.fdv ?? 0,
    marketCap: raw.marketCap ?? 0,
    pairCreatedAt: raw.pairCreatedAt,
    volume: {
      h24: raw.volume?.h24 ?? 0,
      h6: raw.volume?.h6 ?? 0,
      h1: raw.volume?.h1 ?? 0,
      m5: raw.volume?.m5 ?? 0,
    },
    priceChange: {
      h24: raw.priceChange?.h24 ?? 0,
      h6: raw.priceChange?.h6 ?? 0,
      h1: raw.priceChange?.h1 ?? 0,
      m5: raw.priceChange?.m5 ?? 0,
    },
    txns: {
      h24: { buys: raw.txns?.h24?.buys ?? 0, sells: raw.txns?.h24?.sells ?? 0 },
      h6: { buys: raw.txns?.h6?.buys ?? 0, sells: raw.txns?.h6?.sells ?? 0 },
      h1: { buys: raw.txns?.h1?.buys ?? 0, sells: raw.txns?.h1?.sells ?? 0 },
      m5: { buys: raw.txns?.m5?.buys ?? 0, sells: raw.txns?.m5?.sells ?? 0 },
    },
  };
}
