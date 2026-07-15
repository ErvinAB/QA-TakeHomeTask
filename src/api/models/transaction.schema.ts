import { z } from "zod";

export const TransactionSchema = z.object({
  id: z.number().int(),
  accountId: z.number().int(),
  type: z.enum(["Credit", "Debit"]),
  date: z.number(),
  amount: z.number(),
  description: z.string(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionArraySchema = z.array(TransactionSchema);
