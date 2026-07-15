import { test, expect } from "../../src/fixtures/test.fixture";

test.describe("ParaBank API - Idempotency / Edge Case", () => {
  test("idempotent read: same GET returns identical stable fields", async ({
    bankApi,
    region,
  }) => {
    const customer = await bankApi.login(
      region.credentials.username,
      region.credentials.password
    );

    const accounts = await bankApi.getCustomerAccounts(customer.id);
    expect(accounts.length).toBeGreaterThan(0);

    const targetAccountId = accounts[0].id;

    // Perform the same read twice
    const firstRead = await bankApi.getAccount(targetAccountId);
    const secondRead = await bankApi.getAccount(targetAccountId);

    // Core fields must be identical (id, customerId, type are immutable)
    expect(secondRead.id).toBe(firstRead.id);
    expect(secondRead.customerId).toBe(firstRead.customerId);
    expect(secondRead.type).toBe(firstRead.type);

    // Balance should also be identical since we performed two safe reads
    expect(secondRead.balance).toBe(firstRead.balance);
  });

  test("idempotent read: repeated transaction query yields same data", async ({
    bankApi,
    region,
  }) => {
    const customer = await bankApi.login(
      region.credentials.username,
      region.credentials.password
    );

    const accounts = await bankApi.getCustomerAccounts(customer.id);
    expect(accounts.length).toBeGreaterThan(0);

    const targetAccountId = accounts[0].id;

    const firstTxList = await bankApi.getAccountTransactions(targetAccountId);
    const secondTxList = await bankApi.getAccountTransactions(targetAccountId);

    expect(secondTxList.length).toBe(firstTxList.length);

    // Verify stable fields match for each transaction
    for (let i = 0; i < firstTxList.length; i++) {
      expect(secondTxList[i].id).toBe(firstTxList[i].id);
      expect(secondTxList[i].accountId).toBe(firstTxList[i].accountId);
      expect(secondTxList[i].type).toBe(firstTxList[i].type);
      expect(secondTxList[i].amount).toBe(firstTxList[i].amount);
    }
  });
});
