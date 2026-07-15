import { z } from "zod";

export const AccountSchema = z.object({
  id: z.number().int(),
  customerId: z.number().int(),
  type: z.enum(["CHECKING", "SAVINGS", "LOAN"]),
  balance: z.number(),
});

export type Account = z.infer<typeof AccountSchema>;

export const AccountArraySchema = z.array(AccountSchema);
