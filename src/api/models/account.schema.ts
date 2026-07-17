import { z } from "zod";

export const AccountAttributesSchema = z.object({
  created_at: z.string(),
  updated_at: z.string(),
  active: z.boolean().optional(),
  order: z.number().nullable().optional(),
  name: z.string(),
  type: z.enum(["asset", "expense", "revenue", "liability"]),
  account_role: z.string().nullable().optional(),
  currency_id: z.string().optional(),
  currency_name: z.string().optional(),
  currency_code: z.string(),
  currency_symbol: z.string(),
  currency_decimal_places: z.number(),
  primary_currency_id: z.string().optional(),
  primary_currency_name: z.string().optional(),
  primary_currency_code: z.string().optional(),
  primary_currency_symbol: z.string().optional(),
  primary_currency_decimal_places: z.number().optional(),
  current_balance: z.string(),
  current_balance_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  include_net_worth: z.boolean().optional(),
  account_number: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),
  opening_balance: z.string().nullable().optional(),
  opening_balance_date: z.string().nullable().optional(),
  virtual_balance: z.string().nullable().optional(),
}).passthrough();

export const AccountResourceSchema = z.object({
  type: z.literal("accounts"),
  id: z.string(),
  attributes: AccountAttributesSchema,
}).passthrough();

export const AccountDataSchema = z.object({
  data: AccountResourceSchema,
}).passthrough();

export const AccountCollectionSchema = z.object({
  data: z.array(AccountResourceSchema),
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

export type AccountData = z.infer<typeof AccountDataSchema>;
export type AccountCollection = z.infer<typeof AccountCollectionSchema>;

export const CreateAccountSchema = z.object({
  name: z.string(),
  type: z.enum(["asset", "expense", "revenue", "liability"]),
  currency_code: z.string(),
  account_role: z.string().optional(),
  notes: z.string().optional(),
  opening_balance: z.string().optional(),
  opening_balance_date: z.string().optional(),
});
