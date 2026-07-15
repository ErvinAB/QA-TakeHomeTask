import { z } from "zod";

export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
});

export const CustomerSchema = z.object({
  id: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
  address: AddressSchema,
  phoneNumber: z.string(),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must match format XXX-XX-XXXX"),
});

export type Customer = z.infer<typeof CustomerSchema>;
