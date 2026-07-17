import { z } from "zod";

export const TransactionSplitSchema = z.object({
  type: z.string(),
  date: z.string(),
  amount: z.string(),
  description: z.string(),
  source_name: z.string().optional(),
  destination_name: z.string().optional(),
  currency_code: z.string().optional(),
  currency_symbol: z.string().optional(),
  currency_decimal_places: z.number().optional(),
  category_name: z.string().nullable().optional(),
}).passthrough();

export const TransactionResourceSchema = z.object({
  type: z.literal("transactions"),
  id: z.string(),
  attributes: z.object({
    created_at: z.string(),
    updated_at: z.string(),
    transactions: z.array(TransactionSplitSchema).optional(),
  }).passthrough(),
}).passthrough();

export const TransactionDataSchema = z.object({
  data: TransactionResourceSchema,
}).passthrough();

export const TransactionCollectionSchema = z.object({
  data: z.array(TransactionResourceSchema),
  meta: z.object({
    pagination: z.object({
      total: z.number(),
      count: z.number(),
      per_page: z.number(),
      current_page: z.number(),
      total_pages: z.number(),
    }).optional(),
  }).optional(),
}).passthrough();

export type TransactionData = z.infer<typeof TransactionDataSchema>;
export type TransactionCollection = z.infer<typeof TransactionCollectionSchema>;

export const CreateTransactionSchema = z.object({
  error_if_duplicate_hash: z.boolean().optional(),
  transactions: z.array(z.object({
    type: z.enum(["withdrawal", "deposit", "transfer"]),
    date: z.string(),
    amount: z.string(),
    description: z.string(),
    source_name: z.string(),
    destination_name: z.string(),
    currency_code: z.string().optional(),
    category_name: z.string().optional(),
  })),
});
