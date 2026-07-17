import type { APIRequestContext } from "@playwright/test";
import { z } from "zod";
import {
  validateResponse,
  type ValidatedResponse,
} from "../support/response.helper";
import {
  FireflyAboutSchema,
  FireflyUserSchema,
  type FireflyAbout,
  type FireflyUser,
} from "../models/about.schema";
import {
  AccountDataSchema,
  AccountCollectionSchema,
  CreateAccountSchema,
  type AccountData,
  type AccountCollection,
} from "../models/account.schema";
import {
  TransactionDataSchema,
  TransactionCollectionSchema,
  CreateTransactionSchema,
  type TransactionData,
  type TransactionCollection,
} from "../models/transaction.schema";
import {
  FireflyErrorSchema,
  type FireflyError,
} from "../models/error.schema";

const UserGroupSchema = z.object({
  type: z.literal("user_groups"),
  id: z.string(),
  attributes: z.object({
    created_at: z.string(),
    updated_at: z.string(),
    in_use: z.boolean(),
    can_see_members: z.boolean(),
    title: z.string(),
    primary_currency_id: z.string(),
    primary_currency_name: z.string(),
    primary_currency_code: z.string(),
    primary_currency_symbol: z.string(),
    primary_currency_decimal_places: z.number(),
    members: z.array(z.unknown()),
  }).passthrough(),
}).passthrough();

const UserGroupCollectionSchema = z.object({
  data: z.array(UserGroupSchema),
}).passthrough();

type UserGroupInfo = { primary_currency_code: string; title: string; id: string };

export class FireflyApiClient {
  private readonly token: string;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
    token: string,
  ) {
    this.token = token;
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/json",
    };
  }

  async getAbout(): Promise<FireflyAbout> {
    const response = await this.request.get(`${this.baseUrl}/about`, {
      headers: { ...this.authHeaders(), Accept: "application/json" },
    });
    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: FireflyAboutSchema,
      contentType: "application/json",
    });
    return validated.body;
  }

  async getCurrentUser(): Promise<FireflyUser> {
    const response = await this.request.get(`${this.baseUrl}/about/user`, {
      headers: this.authHeaders(),
    });
    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: FireflyUserSchema,
      contentType: "application/vnd.api+json",
    });
    return validated.body;
  }

  async getAccount(accountId: string): Promise<AccountData> {
    const response = await this.request.get(
      `${this.baseUrl}/accounts/${encodeURIComponent(accountId)}`,
      { headers: this.authHeaders() }
    );
    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: AccountDataSchema,
      contentType: "application/vnd.api+json",
    });
    return validated.body;
  }

  async listAccounts(type?: string): Promise<AccountCollection> {
    const url = new URL(`${this.baseUrl}/accounts`);
    if (type) url.searchParams.set("type", type);

    const response = await this.request.get(url.toString(), {
      headers: this.authHeaders(),
    });
    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: AccountCollectionSchema,
      contentType: "application/vnd.api+json",
    });
    return validated.body;
  }

  async createAccount(data: {
    name: string;
    type: "asset" | "expense" | "revenue" | "liability";
    currency_code: string;
    account_role?: string;
    notes?: string;
    opening_balance?: string;
    opening_balance_date?: string;
  }): Promise<AccountData> {
    const validated = CreateAccountSchema.parse(data);
    const response = await this.request.post(`${this.baseUrl}/accounts`, {
      headers: this.authHeaders(),
      data: validated,
    });
    const result = await validateResponse(response, {
      expectedStatus: 200,
      schema: AccountDataSchema,
      contentType: "application/vnd.api+json",
    });
    return result.body;
  }

  async getTransaction(transactionId: string): Promise<TransactionData> {
    const response = await this.request.get(
      `${this.baseUrl}/transactions/${encodeURIComponent(transactionId)}`,
      { headers: this.authHeaders() }
    );
    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: TransactionDataSchema,
      contentType: "application/vnd.api+json",
    });
    return validated.body;
  }

  async listTransactions(
    type?: string,
    accountId?: string
  ): Promise<TransactionCollection> {
    const url = new URL(`${this.baseUrl}/transactions`);
    if (type) url.searchParams.set("type", type);
    if (accountId) url.searchParams.set("accounts", accountId);

    const response = await this.request.get(url.toString(), {
      headers: this.authHeaders(),
    });
    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: TransactionCollectionSchema,
      contentType: "application/vnd.api+json",
    });
    return validated.body;
  }

  async createTransaction(data: {
    error_if_duplicate_hash?: boolean;
    transactions: Array<{
      type: "withdrawal" | "deposit" | "transfer";
      date: string;
      amount: string;
      description: string;
      source_name: string;
      destination_name: string;
      currency_code?: string;
      category_name?: string;
    }>;
  }): Promise<TransactionData> {
    const validated = CreateTransactionSchema.parse(data);
    const response = await this.request.post(`${this.baseUrl}/transactions`, {
      headers: this.authHeaders(),
      data: validated,
    });
    const result = await validateResponse(response, {
      expectedStatus: 200,
      schema: TransactionDataSchema,
      contentType: "application/vnd.api+json",
    });
    return result.body;
  }

  async getUserGroups(): Promise<UserGroupInfo[]> {
    const response = await this.request.get(`${this.baseUrl}/user-groups`, {
      headers: this.authHeaders(),
    });
    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: UserGroupCollectionSchema,
      contentType: "application/vnd.api+json",
    });
    return validated.body.data.map((g) => ({
      primary_currency_code: g.attributes.primary_currency_code,
      title: g.attributes.title,
      id: g.id,
    }));
  }

  async getAccountExpectingError(
    accountId: string
  ): Promise<ValidatedResponse<FireflyError>> {
    const response = await this.request.get(
      `${this.baseUrl}/accounts/${encodeURIComponent(accountId)}`,
      { headers: this.authHeaders() }
    );
    return validateResponse(response, {
      expectedStatus: 401,
      schema: FireflyErrorSchema,
      contentType: "application/json",
    });
  }

  async missingTokenGetAbout(): Promise<ValidatedResponse<FireflyError>> {
    const response = await this.request.get(`${this.baseUrl}/about`, {
      headers: { Accept: "application/json" },
    });
    return validateResponse(response, {
      expectedStatus: 401,
      schema: FireflyErrorSchema,
      contentType: "application/json",
    });
  }

  async invalidTokenGetAbout(): Promise<ValidatedResponse<FireflyError>> {
    const response = await this.request.get(`${this.baseUrl}/about`, {
      headers: {
        Authorization: "Bearer invalid-token-12345",
        Accept: "application/json",
      },
    });
    return validateResponse(response, {
      expectedStatus: 401,
      schema: FireflyErrorSchema,
      contentType: "application/json",
    });
  }
}
