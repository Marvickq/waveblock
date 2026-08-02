import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getProvider } from "@/lib/ethers";
import { createCompletion } from "@/lib/ai/openrouter";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { guardianSchema } from "@/lib/validation";

const APPROVAL_IFACE = new ethers.Interface([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function increaseAllowance(address spender, uint256 addedValue) returns (bool)",
  "function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)",
]);

const KNOWN_SELECTORS: { selector: string; label: string; severity: "info" | "caution" | "danger" }[] = [
  { selector: "0x095ea7b3", label: "approve(address,uint256)", severity: "caution" },
  { selector: "0xa9059cbb", label: "transfer(address,uint256)", severity: "info" },
  { selector: "0x23b872dd", label: "transferFrom(address,address,uint256)", severity: "caution" },
  { selector: "0xdd62ed3e", label: "allowance(address,address)", severity: "info" },
  { selector: "0x095ea7b3", label: "increaseAllowance(address,uint256)", severity: "caution" },
  { selector: "0xdaa09e9d", label: "decreaseAllowance(address,uint256)", severity: "caution" },
  { selector: "0xf2fde38b", label: "transferOwnership(address)", severity: "caution" },
  { selector: "0x715018a6", label: "renounceOwnership()", severity: "danger" },
  { selector: "0x8da5cb5b", label: "owner()", severity: "info" },
  { selector: "0x40c10f19", label: "mint(address,uint256)", severity: "danger" },
  { selector: "0x42966c68", label: "burn(uint256)", severity: "info" },
  { selector: "0x79cc6790", label: "burnFrom(address,uint256)", severity: "caution" },
  { selector: "0x8456cb59", label: "pause()", severity: "caution" },
  { selector: "0x3f4ba83a", label: "unpause()", severity: "info" },
  { selector: "0x230db3b2", label: "addBlacklist(address)", severity: "danger" },
  { selector: "0x9b2ea4bd", label: "removeBlacklist(address)", severity: "danger" },
  { selector: "0x6c1aaf13", label: "setCooldown(uint256)", severity: "caution" },
  { selector: "0x4a393119", label: "setSwapEnabled(bool)", severity: "danger" },
  { selector: "0x8f283970", label: "changeRouter(address)", severity: "danger" },
  { selector: "0x5292cef5", label: "setTax(uint256,uint256)", severity: "danger" },
  { selector: "0x5c975abb", label: "paused()", severity: "info" },
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
interface SimulatedResult {
  simulated: boolean;
  status: "SUCCESS" | "REVERT" | "FAILED";
  revertReason: string | null;
  gasUsed: string | null;
}

async function simulateTx(
  provider: ethers.Provider,
  tx: { to: string; data: string; value: string; from: string },
): Promise<SimulatedResult> {
  const value = tx.value && BigInt(tx.value) > BigInt(0) ? tx.value : "0x0";
  try {
    const [callData, estimate] = await Promise.all([
      provider.call({ to: tx.to, data: tx.data, value, from: tx.from }),
      provider.estimateGas({ to: tx.to, data: tx.data, value, from: tx.from }).catch(() => null),
    ]);
    if (callData && callData !== "0x") {
      return { simulated: true, status: "SUCCESS", revertReason: null, gasUsed: estimate ? estimate.toString() : null };
    }
    return { simulated: true, status: "SUCCESS", revertReason: null, gasUsed: estimate ? estimate.toString() : null };
  } catch (err: any) {
    const revertReason = extractRevertReason(err);
    return {
      simulated: true,
      status: "REVERT",
      revertReason,
      gasUsed: null,
    };
  }
}

function extractRevertReason(err: any): string | null {
  if (!err) return null;
  if (typeof err.shortMessage === "string" && err.shortMessage.length > 0) {
    return err.shortMessage.slice(0, 160);
  }
  if (typeof err.reason === "string" && err.reason.length > 0) return err.reason.slice(0, 160);
  if (typeof err.message === "string") {
    const msg = err.message;
    if (msg.includes("revert")) {
      const match = msg.match(/revert\s+(.*?)(?:,\s|\s*$)/i);
      if (match) return match[1].trim().slice(0, 160);
    }
    if (msg.startsWith("data (")) {
      return "execution reverted (no readable revert reason)";
    }
  }
  return "Transaction would revert";
}

function decodeApprovalAmount(data: string, iface: ethers.Interface): { spender: string; amount: bigint; unlimited: boolean } | null {
  for (const fn of ["approve", "increaseAllowance"]) {
    try {
      const decoded = iface.decodeFunctionData(fn, data);
      const spender = decoded.spender.toLowerCase();
      const amount = BigInt(decoded.amount);
      return { spender, amount, unlimited: amount >= BigInt(2) ** BigInt(255) };
    } catch {
      continue;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = guardianSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { to, from, data, value } = parsed.data;
    const provider = getProvider();
    const warnings: string[] = [];
    let riskLevel: "SAFE" | "CAUTION" | "HIGH_RISK" = "SAFE";
    let gasEstimate: string | null = null;
    let approvalTarget: string | null = null;
    let approvalAmount: string | null = null;
    let approvalUnlimited = false;
    let tokenTransfer: { to: string; amount: string } | null = null;
    let decodedFunction: string | null = null;

    const dataLower = data.toLowerCase();
    const selector = dataLower.slice(0, 10);

    const known = KNOWN_SELECTORS.find((s) => s.selector === selector);
    if (known) {
      decodedFunction = known.label;
      if (known.severity === "danger") {
        warnings.push(`Suspicious function call: ${known.label}`);
        riskLevel = "HIGH_RISK";
      } else if (known.severity === "caution" && riskLevel === "SAFE") {
        riskLevel = "CAUTION";
      }
    } else {
      warnings.push(`Unknown function selector ${selector} — behaviour cannot be verified`);
      riskLevel = "CAUTION";
    }

    // Decode approval
    if (selector === "0x095ea7b3") {
      const decoded = decodeApprovalAmount(data, APPROVAL_IFACE);
      if (decoded) {
        approvalTarget = decoded.spender;
        approvalAmount = decoded.amount.toString();
        approvalUnlimited = decoded.unlimited;
        if (decoded.unlimited) {
          warnings.push("Unlimited approval detected — spender can drain all of your tokens at any time");
          riskLevel = "HIGH_RISK";
        } else {
          const readable = ethers.formatUnits(decoded.amount, 18);
          warnings.push(`Approval of ${readable} tokens to ${decoded.spender.slice(0, 6)}...${decoded.spender.slice(-4)}`);
          if (riskLevel === "SAFE") riskLevel = "CAUTION";
        }
        try {
          const code = await provider.getCode(decoded.spender);
          if (code === "0x" || code === "0x0") {
            warnings.push("Approval target has no contract code (EOA) — funds approved to a plain wallet cannot be clawed back");
            riskLevel = "HIGH_RISK";
          }
        } catch {}
      } else {
        warnings.push("Could not decode approval data");
      }
    }

    // Decode transfer
    if (selector === "0xa9059cbb") {
      try {
        const decoded = APPROVAL_IFACE.decodeFunctionData("transfer", data);
        tokenTransfer = { to: decoded.to.toLowerCase(), amount: decoded.amount.toString() };
        if (tokenTransfer.to === ZERO_ADDRESS) {
          warnings.push("Transfer to zero address — tokens will be permanently burned");
        }
      } catch {}
      if (value && BigInt(value) > 0) {
        const ethValue = ethers.formatEther(value);
        if (Number(ethValue) > 10) {
          warnings.push(`Large ETH transfer: ${ethValue} ETH`);
          if (riskLevel === "SAFE") riskLevel = "CAUTION";
        }
      }
    }

    // TransferFrom = spending another wallet's allowance
    if (selector === "0x23b872dd") {
      try {
        const decoded = APPROVAL_IFACE.decodeFunctionData("transferFrom", data);
        const spenderSide = decoded.from.toLowerCase();
        warnings.push(`transferFrom pulls funds from ${spenderSide.slice(0, 6)}...${spenderSide.slice(-4)} — confirm this wallet has approved the caller`);
        riskLevel = "HIGH_RISK";
      } catch {}
    }

    // Simulation
    const sim = await simulateTx(provider, { to, data, value, from });
    if (sim.status === "REVERT") {
      warnings.push(`Transaction simulation reverted${sim.revertReason ? `: ${sim.revertReason}` : ""}`);
      riskLevel = "HIGH_RISK";
    } else if (sim.gasUsed) {
      gasEstimate = sim.gasUsed;
    }

    // AI analysis grounded strictly on simulation results
    let aiRecommendation = "";
    if (riskLevel !== "SAFE" || warnings.length > 0) {
      try {
        const prompt = `Analyze this Ethereum transaction for security risks. Base your answer ONLY on the data below — do not speculate beyond it.

Transaction data:
- To: ${to}
- Selector: ${selector}${decodedFunction ? ` (${decodedFunction})` : ""}
- Value: ${value && BigInt(value) > 0 ? ethers.formatEther(value) + " ETH" : "0 ETH"}
${approvalTarget ? `- Approval Target: ${approvalTarget}` : ""}
${approvalAmount ? `- Approval Amount: ${approvalUnlimited ? "UNLIMITED" : ethers.formatEther(approvalAmount) + " tokens"}` : ""}
${tokenTransfer ? `- Transfer to: ${tokenTransfer.to}, Amount: ${ethers.formatEther(tokenTransfer.amount)} tokens` : ""}
- Simulation status: ${sim.status === "REVERT" ? "REVERTED" : "SUCCESS"}${sim.revertReason ? ` (${sim.revertReason})` : ""}

Warnings:
${warnings.map((w) => `- ${w}`).join("\n")}

Risk Level: ${riskLevel}

Provide a 1-2 sentence recommendation for the user. Be concise and direct. If the transaction is dangerous, say exactly why based on the simulation results above.`;

        const { content } = await createCompletion(prompt, { temperature: 0.3, maxTokens: 300 });
        aiRecommendation = content?.trim() || "Review the warnings above before signing.";
      } catch {
        aiRecommendation = "Review the warnings above before signing.";
      }
    }

    if (riskLevel === "SAFE" && warnings.length === 0) {
      aiRecommendation = "This transaction simulated successfully and no risk flags were detected.";
    }

    const session = await getSession();

    try {
      await prisma.guardianCheck.create({
        data: {
          txTo: String(to).toLowerCase(),
          selector,
          riskLevel,
          warnings: JSON.stringify(warnings),
          aiRecommendation,
          gasEstimate,
          userId: session?.userId ?? null,
        },
      });
    } catch {
      // Non-fatal — history persistence should not break the check
    }

    return NextResponse.json({
      riskLevel,
      warnings,
      gasEstimate,
      aiRecommendation,
      simulation: sim,
      details: {
        functionSelector: selector,
        decodedFunction,
        approvalTarget,
        approvalUnlimited,
        approvalAmount: approvalUnlimited ? null : approvalAmount,
        tokenTransfer,
      },
    });
  } catch (err: any) {
    console.error("Guardian error:", err);
    return NextResponse.json({
      riskLevel: "HIGH_RISK",
      warnings: ["Transaction simulation failed"],
      aiRecommendation: "Unable to simulate this transaction. Exercise extreme caution.",
      gasEstimate: null,
      simulation: { simulated: false, status: "FAILED", revertReason: null, gasUsed: null },
      details: {},
    });
  }
}
