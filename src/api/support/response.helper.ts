import type { APIResponse } from "@playwright/test";
import { z, type ZodSchema } from "zod";

export interface ValidatedResponse<T> {
  status: number;
  body: T;
  rawText: string;
}

function redactSensitive(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;

  const SENSITIVE_KEYS = new Set(["password", "ssn", "token", "secret"]);

  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = typeof val === "string" ? "***REDACTED***" : "[redacted]";
    } else {
      result[key] = redactSensitive(val);
    }
  }
  return result;
}

function formatBodyForError(rawText: string): string {
  try {
    const parsed: unknown = JSON.parse(rawText);
    const redacted = redactSensitive(parsed);
    return JSON.stringify(redacted, null, 2).slice(0, 1000);
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
      `Expected HTTP ${expectedStatus} but received ${status}. ` +
        `Response body: ${formatBodyForError(rawText)}`
    );
  }

  if (contentType !== undefined) {
    const actualContentType = response.headers()["content-type"] ?? "";
    if (!actualContentType.includes(contentType)) {
      throw new Error(
        `Expected content-type "${contentType}" but received "${actualContentType}".`
      );
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const stringResult = z.string().safeParse(rawText);
    if (stringResult.success) {
      return { status, body: stringResult.data as T, rawText };
    }
    throw new Error(
      `Failed to parse response body as JSON. Raw response (first 500 chars): ${rawText.slice(0, 500)}`
    );
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Schema validation failed:\n${result.error.format()}\n` +
        `Response body: ${formatBodyForError(rawText)}`
    );
  }

  return { status, body: result.data, rawText };
}
