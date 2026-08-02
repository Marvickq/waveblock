import { ethers } from "ethers";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
];

let _provider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) throw new Error("RPC_URL not configured");
    _provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return _provider;
}

export interface TokenOnChainData {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  owner: string | null;
}

export async function fetchTokenData(address: string): Promise<TokenOnChainData> {
  const provider = getProvider();
  const contract = new ethers.Contract(address, ERC20_ABI, provider);

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    contract.name().catch(() => "Unknown"),
    contract.symbol().catch(() => "???"),
    contract.decimals().catch(() => 18),
    contract.totalSupply().catch(() => "0"),
  ]);

  let owner: string | null = null;
  try {
    owner = await contract.owner();
  } catch {
    try {
      const code = await provider.getCode(address);
      if (code !== "0x") {
        const storageOwner = await provider.getStorage(address, 0);
        if (storageOwner && storageOwner !== "0x" + "0".repeat(64)) {
          const addr = "0x" + storageOwner.slice(-40);
          if (addr !== "0x0000000000000000000000000000000000000000") {
            owner = addr;
          }
        }
      }
    } catch {
      owner = null;
    }
  }

  return {
    name: String(name),
    symbol: String(symbol),
    decimals: Number(decimals),
    totalSupply: totalSupply.toString(),
    owner,
  };
}

export async function getNetworkInfo(): Promise<{ chainId: number; blockNumber: number }> {
  const provider = getProvider();
  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();
  return { chainId: Number(network.chainId), blockNumber };
}

export async function verifyContract(address: string, apiKey?: string): Promise<boolean> {
  const key = apiKey || process.env.ETHERSCAN_API_KEY;
  if (!key) return false;

  try {
    const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "1" && data.result?.[0]?.SourceCode) {
      return data.result[0].SourceCode !== "";
    }
    return false;
  } catch {
    return false;
  }
}

export function getBrowserProvider() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    return null;
  }
  return new ethers.BrowserProvider((window as any).ethereum);
}
