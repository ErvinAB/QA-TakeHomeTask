import type { APIRequestContext } from "@playwright/test";
import { z } from "zod";
import {
  validateResponse,
  type ValidatedResponse,
} from "../support/response.helper";
import { CustomerSchema, type Customer } from "../models/customer.schema";
import {
  AccountSchema,
  AccountArraySchema,
  type Account,
} from "../models/account.schema";
import {
  TransactionArraySchema,
  type Transaction,
} from "../models/transaction.schema";

export const AccountType = {
  CHECKING: 0,
  SAVINGS: 1,
  LOAN: 2,
} as const;

export type AccountTypeValue = (typeof AccountType)[keyof typeof AccountType];

const ErrorTextSchema = z.string();

export class BankApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string
  ) {}

  private accountPath(accountId: number): string {
    return `${this.baseUrl}/accounts/${encodeURIComponent(String(accountId))}`;
  }

  private customerPath(customerId: number): string {
    return `${this.baseUrl}/customers/${encodeURIComponent(String(customerId))}`;
  }

  async login(username: string, password: string): Promise<Customer> {
    const response = await this.request.get(
      `${this.baseUrl}/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`,
      { headers: { Accept: "application/json" } }
    );

    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: CustomerSchema,
      contentType: "application/json",
    });

    return validated.body;
  }

  async getCustomer(customerId: number): Promise<Customer> {
    const response = await this.request.get(this.customerPath(customerId), {
      headers: { Accept: "application/json" },
    });

    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: CustomerSchema,
      contentType: "application/json",
    });

    return validated.body;
  }

  async getCustomerAccounts(customerId: number): Promise<Account[]> {
    const response = await this.request.get(
      `${this.customerPath(customerId)}/accounts`,
      { headers: { Accept: "application/json" } }
    );

    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: AccountArraySchema,
      contentType: "application/json",
    });

    return validated.body;
  }

  async getAccount(accountId: number): Promise<Account> {
    const response = await this.request.get(this.accountPath(accountId), {
      headers: { Accept: "application/json" },
    });

    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: AccountSchema,
      contentType: "application/json",
    });

    return validated.body;
  }

  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    const response = await this.request.get(
      `${this.accountPath(accountId)}/transactions`,
      { headers: { Accept: "application/json" } }
    );

    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: TransactionArraySchema,
      contentType: "application/json",
    });

    return validated.body;
  }

  async createAccount(
    customerId: number,
    accountType: AccountTypeValue,
    fromAccountId: number
  ): Promise<Account> {
    const params = new URLSearchParams({
      customerId: String(customerId),
      newAccountType: String(accountType),
      fromAccountId: String(fromAccountId),
    });

    const response = await this.request.post(
      `${this.baseUrl}/createAccount?${params.toString()}`,
      { headers: { Accept: "application/json" } }
    );

    const validated = await validateResponse(response, {
      expectedStatus: 200,
      schema: AccountSchema,
      contentType: "application/json",
    });

    return validated.body;
  }

  async loginExpectingError(
    username: string,
    password: string
  ): Promise<ValidatedResponse<string>> {
    const response = await this.request.get(
      `${this.baseUrl}/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`,
      { headers: { Accept: "application/json" } }
    );

    return validateResponse(response, {
      expectedStatus: 400,
      schema: ErrorTextSchema,
    });
  }

  async getAccountExpectingError(
    accountId: number
  ): Promise<ValidatedResponse<string>> {
    const response = await this.request.get(this.accountPath(accountId), {
      headers: { Accept: "application/json" },
    });

    return validateResponse(response, {
      expectedStatus: 400,
      schema: ErrorTextSchema,
    });
  }

  async getCustomerExpectingError(
    customerId: number
  ): Promise<ValidatedResponse<string>> {
    const response = await this.request.get(this.customerPath(customerId), {
      headers: { Accept: "application/json" },
    });

    return validateResponse(response, {
      expectedStatus: 400,
      schema: ErrorTextSchema,
    });
  }
}
