import { z } from "zod";

export const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const analyzeSchema = z.object({
  address: addressSchema,
});

export const siweVerifySchema = z.object({
  message: z.string().min(1, "Message is required"),
  signature: z.string().min(1, "Signature is required"),
});

export const guardianSchema = z.object({
  to: addressSchema,
  from: addressSchema,
  data: z
    .string()
    .min(2, "Call data is required")
    .regex(/^0x[a-fA-F0-9]+$/, "Call data must be valid hex"),
  value: z
    .string()
    .regex(/^0x[0-9a-fA-F]+$|^\d+$/, "Value must be a hex or decimal string")
    .optional()
    .default("0x0"),
  chainId: z.coerce.number().int().positive().optional(),
});

export const registrySaveSchema = z.object({
  analysisId: z.string().min(1, "analysisId is required"),
});

export const registryVerifySchema = z.object({
  reportHash: z.string().min(1, "reportHash is required"),
});

export const copilotChatSchema = z.object({
  message: z.string().min(1, "Message is required").max(4000, "Message is too long"),
  tokenAddress: addressSchema.optional().or(z.literal("")),
  compareAddresses: z.array(addressSchema).max(4).optional(),
  conversationId: z.string().max(64).optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "ai"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

export const portfolioHistorySchema = z.object({
  wallet: addressSchema,
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
