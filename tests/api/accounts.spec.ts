import { test, expect } from "../../src/fixtures/test.fixture";
import {
  AccountArraySchema,
} from "../../src/api/models/account.schema";

test.describe("ParaBank API - Accounts", () => {
  test("happy path: retrieve customer accounts with schema validation", async ({
    bankApi,
    region,
  }) => {
    const customer = await bankApi.login(
      region.credentials.username,
      region.credentials.password
    );

    const accounts = await bankApi.getCustomerAccounts(customer.id);

    expect(accounts.length, "customer should have at least one account").toBeGreaterThan(0);

    // Schema validation demonstrated explicitly
    const parseResult = AccountArraySchema.safeParse(accounts);
    expect(
      parseResult.success,
      `Account array schema should pass validation: ${parseResult.success ? "ok" : parseResult.error.message}`
    ).toBe(true);

    // Verify relationship integrity
    for (const account of accounts) {
      expect(account.customerId, `account.customerId should match customer.id`).toBe(
        customer.id
      );
      expect(account.id, "account.id should be a positive integer").toBeGreaterThan(0);
      expect(["CHECKING", "SAVINGS", "LOAN"]).toContain(account.type);
    }
  });

  test("happy path: get individual account details", async ({
    bankApi,
    region,
  }) => {
    const customer = await bankApi.login(
      region.credentials.username,
      region.credentials.password
    );

    const accounts = await bankApi.getCustomerAccounts(customer.id);
    expect(accounts.length).toBeGreaterThan(0);

    const firstAccount = await bankApi.getAccount(accounts[0].id);
    expect(firstAccount.id).toBe(accounts[0].id);
    expect(firstAccount.customerId).toBe(customer.id);
    expect(firstAccount.type).toBe(accounts[0].type);
  });

  test("happy path: get account transactions", async ({
    bankApi,
    region,
  }) => {
    const customer = await bankApi.login(
      region.credentials.username,
      region.credentials.password
    );

    const accounts = await bankApi.getCustomerAccounts(customer.id);
    expect(accounts.length).toBeGreaterThan(0);

    const transactions = await bankApi.getAccountTransactions(accounts[0].id);

    if (transactions.length > 0) {
      const tx = transactions[0];
      expect(tx.id).toBeGreaterThan(0);
      expect(tx.accountId).toBe(accounts[0].id);
      expect(["Credit", "Debit"]).toContain(tx.type);
      expect(tx.amount).toBeGreaterThanOrEqual(0);
      expect(tx.description).toBeTruthy();
    }
  });

  test("error: get account for nonexistent account returns 400", async ({
    bankApi,
  }) => {
    const response = await bankApi.getAccountExpectingError(99999999);
    expect(response.status).toBe(400);
    expect(response.body).toContain("Could not find account");
  });
});
