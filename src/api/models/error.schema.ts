import { z } from "zod";

export const FireflyErrorSchema = z.object({
  message: z.string(),
  exception: z.string(),
}).passthrough();

export type FireflyError = z.infer<typeof FireflyErrorSchema>;
