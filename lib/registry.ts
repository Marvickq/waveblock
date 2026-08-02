import { ethers } from "ethers";
import { getProvider } from "@/lib/ethers";

export const REGISTRY_ABI = [
  "function saveReportHash(bytes32 reportHash, string calldata tokenAddress) external returns (uint256 id)",
  "function verifyReport(bytes32 reportHash) external view returns (bool exists, uint256 id)",
  "function getReportHash(uint256 id) external view returns (bytes32 reportHash, uint256 timestamp, string memory tokenAddress)",
  "function reportCount() external view returns (uint256)",
  "function owner() external view returns (address)",
] as const;

export interface RegistryConfig {
  configured: boolean;
  contractAddress: string | null;
  adminWallet: string | null;
  chainId: number | null;
  explorerUrl: string | null;
}

export function getRegistryConfig(): RegistryConfig {
  const contractAddress = process.env.REGISTRY_CONTRACT_ADDRESS?.toLowerCase() ?? null;
  const hasKey = Boolean(process.env.ADMIN_PRIVATE_KEY);
  const explorerUrl = contractAddress
    ? `https://etherscan.io/address/${contractAddress}`
    : null;
  return {
    configured: Boolean(contractAddress) && hasKey,
    contractAddress,
    adminWallet: hasKey ? deriveWalletAddress() : null,
    chainId: 1,
    explorerUrl,
  };
}

function deriveWalletAddress(): string | null {
  try {
    const pk = process.env.ADMIN_PRIVATE_KEY;
    if (!pk) return null;
    return new ethers.Wallet(pk).address.toLowerCase();
  } catch {
    return null;
  }
}

export function computeReportHash(canonicalPayload: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalPayload));
}

/**
 * Build a deterministic canonical string for a TrustReport so the same report
 * always hashes to the same value.
 */
export function canonicalReportPayload(input: {
  analysisId: string;
  tokenAddress: string;
  trustScore: number;
  riskLevel: string;
  scamRisk: string;
  liquidityStatus: string;
  ownershipRisk: string;
  holderConcentration: string;
  contractRisks: string;
  aiSummary: string;
}): string {
  return [
    `analysisId:${input.analysisId}`,
    `tokenAddress:${input.tokenAddress.toLowerCase()}`,
    `trustScore:${input.trustScore}`,
    `riskLevel:${input.riskLevel}`,
    `scamRisk:${input.scamRisk}`,
    `liquidityStatus:${input.liquidityStatus}`,
    `ownershipRisk:${input.ownershipRisk}`,
    `holderConcentration:${input.holderConcentration}`,
    `contractRisks:${input.contractRisks}`,
    `aiSummary:${input.aiSummary}`,
  ].join("|");
}

export function getRegistryContract(signerOrProvider: ethers.Signer | ethers.Provider | null): ethers.Contract | null {
  const address = process.env.REGISTRY_CONTRACT_ADDRESS;
  if (!address) return null;
  return new ethers.Contract(address, REGISTRY_ABI, signerOrProvider ?? getProvider());
}

export function getRegistrySigner(): ethers.Wallet | null {
  const pk = process.env.ADMIN_PRIVATE_KEY;
  if (!pk) return null;
  return new ethers.Wallet(pk, getProvider());
}

export interface SaveResult {
  ok: boolean;
  txHash: string | null;
  blockNumber: number | null;
  blockTimestamp: Date | null;
  registryId: string | null;
  error?: string;
}

export async function saveReportHashOnChain(tokenAddress: string, reportHash: string): Promise<SaveResult> {
  const config = getRegistryConfig();
  if (!config.configured || !config.contractAddress) {
    return { ok: false, txHash: null, blockNumber: null, blockTimestamp: null, registryId: null, error: "Registry not configured" };
  }

  const signer = getRegistrySigner();
  if (!signer) {
    return { ok: false, txHash: null, blockNumber: null, blockTimestamp: null, registryId: null, error: "Registry signer unavailable" };
  }

  const contract = getRegistryContract(signer);
  if (!contract) {
    return { ok: false, txHash: null, blockNumber: null, blockTimestamp: null, registryId: null, error: "Registry contract unavailable" };
  }

  try {
    const tx = await contract.saveReportHash(reportHash, tokenAddress.toLowerCase());
    const receipt = await tx.wait();
    const block = await getProvider().getBlock(receipt.blockNumber);

    let registryId: string | null = null;
    const logs = receipt.logs;
    for (const log of logs) {
      try {
        const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
        if (parsed?.name === "ReportSaved") {
          registryId = parsed.args.id?.toString() ?? null;
          break;
        }
      } catch {}
    }

    return {
      ok: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockTimestamp: block?.timestamp ? new Date(block.timestamp * 1000) : null,
      registryId,
    };
  } catch (err: any) {
    const reason = extractRevertReason(err);
    return { ok: false, txHash: null, blockNumber: null, blockTimestamp: null, registryId: null, error: reason };
  }
}

export interface VerifyResult {
  ok: boolean;
  exists: boolean;
  registryId: string | null;
  timestamp: Date | null;
  tokenAddress: string | null;
  configured: boolean;
  error?: string;
}

export async function verifyReportHashOnChain(reportHash: string): Promise<VerifyResult> {
  const config = getRegistryConfig();
  if (!config.contractAddress) {
    return { ok: false, exists: false, registryId: null, timestamp: null, tokenAddress: null, configured: false, error: "Registry not configured" };
  }

  const contract = getRegistryContract(null);
  if (!contract) {
    return { ok: false, exists: false, registryId: null, timestamp: null, tokenAddress: null, configured: true, error: "Registry contract unavailable" };
  }

  try {
    const [exists, id] = await contract.verifyReport(reportHash);
    const bigId = BigInt(id);
    if (!exists) {
      return { ok: true, exists: false, registryId: null, timestamp: null, tokenAddress: null, configured: true };
    }
    const [storedHash, timestamp, tokenAddress] = await contract.getReportHash(bigId);
    void storedHash;
    return {
      ok: true,
      exists: true,
      registryId: bigId.toString(),
      timestamp: timestamp ? new Date(Number(timestamp) * 1000) : null,
      tokenAddress: tokenAddress || null,
      configured: true,
    };
  } catch (err: any) {
    return { ok: false, exists: false, registryId: null, timestamp: null, tokenAddress: null, configured: true, error: extractRevertReason(err) };
  }
}

export function getTxExplorerUrl(txHash: string): string {
  return `https://etherscan.io/tx/${txHash}`;
}

export function getAddressExplorerUrl(address: string): string {
  return `https://etherscan.io/address/${address}`;
}

function extractRevertReason(err: any): string {
  if (!err) return "Unknown error";
  if (typeof err.shortMessage === "string" && err.shortMessage.length > 0) return err.shortMessage;
  if (typeof err.reason === "string" && err.reason.length > 0) return err.reason;
  if (typeof err.message === "string") return err.message.slice(0, 200);
  return "Transaction failed";
}
