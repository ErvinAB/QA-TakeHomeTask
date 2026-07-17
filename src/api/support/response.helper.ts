import type { APIResponse } from "@playwright/test";
import type { ZodSchema } from "zod";

export interface ValidatedResponse<T> {
  status: number;
  body: T;
  rawText: string;
}

function redactSensitive(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;

  const SENSITIVE = new Set(["password", "token", "secret", "authorization", "app_key", "cookie"]);

  if (Array.isArray(value)) return value.map(redactSensitive);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE.has(k.toLowerCase()) ? "[redacted]" : redactSensitive(v);
  }
  return out;
}

function sanitize(rawText: string): string {
  try {
    const parsed = JSON.parse(rawText);
    return JSON.stringify(redactSensitive(parsed), null, 2).slice(0, 1000);
  } catch {
    return rawText.slice(0, 500);
  }
}

export async function validateResponse<T>(
  response: APIResponse,
  options: {
    expectedStatus?: number;
    schema: ZodSchema<T>;
    contentType?: string;
  }
): Promise<ValidatedResponse<T>> {
  const { expectedStatus, schema, contentType } = options;
  const status = response.status();
  const rawText = await response.text();

  if (expectedStatus !== undefined && status !== expectedStatus) {
    throw new Error(
      `Expected HTTP ${expectedStatus} but received ${status}. Body: ${sanitize(rawText)}`
    );
  }

  if (contentType !== undefined) {
    const actual = response.headers()["content-type"] ?? "";
    if (!actual.includes(contentType)) {
      throw new Error(`Expected content-type "${contentType}" but received "${actual}".`);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Schema validation failed:\n${result.error.format()}\nBody: ${sanitize(rawText)}`
    );
  }

  return { status, body: result.data, rawText };
}
