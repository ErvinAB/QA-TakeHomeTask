import { z } from "zod";

export const FireflyAboutSchema = z.object({
  data: z.object({
    version: z.string(),
    api_version: z.string(),
    php_version: z.string(),
    os: z.string(),
    driver: z.string(),
  }),
});

export type FireflyAbout = z.infer<typeof FireflyAboutSchema>;

export const FireflyUserSchema = z.object({
  data: z.object({
    type: z.literal("users"),
    id: z.string(),
    attributes: z.object({
      created_at: z.string(),
      updated_at: z.string(),
      email: z.string(),
      blocked: z.boolean(),
      blocked_code: z.string().nullable().optional(),
      role: z.string(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

export type FireflyUser = z.infer<typeof FireflyUserSchema>;
