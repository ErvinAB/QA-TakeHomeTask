import { test, expect } from "../../src/fixtures/test.fixture";
import {
  createAssetAccount,
  createExpenseAccount,
  createWithdrawal,
} from "../../src/test-data/factories";

test.describe("Firefly III API - Transactions", () => {
  test("happy path: create withdrawal and retrieve it by ID", async ({
    fireflyApi,
    region,
  }, testInfo) => {
    const id = testInfo.testId;
    const asset = await fireflyApi.createAccount(createAssetAccount(region.name, id, region.currencyCode));
    const expense = await fireflyApi.createAccount(createExpenseAccount(region.name, id, region.currencyCode));

    const txData = createWithdrawal(
      asset.data.attributes.name,
      expense.data.attributes.name,
      "25.50",
      `Withdrawal ${region.name} ${id}`,
      region.currencyCode
    );
    const tx = await fireflyApi.createTransaction({ transactions: [txData] });

    expect(tx.data.id).toBeTruthy();
    const split = tx.data.attributes.transactions?.[0];
    expect(split).toBeDefined();
    expect(split!.description).toBe(txData.description);
    expect(Number(split!.amount)).toBe(Number(txData.amount));
    expect(split!.type).toBe("withdrawal");
    expect(split!.source_name).toBe(asset.data.attributes.name);
    expect(split!.destination_name).toBe(expense.data.attributes.name);

    const retrieved = await fireflyApi.getTransaction(tx.data.id);
    expect(retrieved.data.id).toBe(tx.data.id);
    expect(retrieved.data.attributes.transactions?.[0]?.description).toBe(txData.description);
  });

  test("happy path: list transactions returns non-empty collection", async ({
    fireflyApi,
    region,
  }, testInfo) => {
    const id = testInfo.testId;
    const asset = await fireflyApi.createAccount(createAssetAccount(region.name, id, region.currencyCode));
    const expense = await fireflyApi.createAccount(createExpenseAccount(region.name, id, region.currencyCode));

    await fireflyApi.createTransaction({
      transactions: [createWithdrawal(asset.data.attributes.name, expense.data.attributes.name, "10.00", `List ${region.name} ${id}`, region.currencyCode)],
    });

    const list = await fireflyApi.listTransactions("withdrawal");
    expect(list.data.length).toBeGreaterThan(0);
  });

  test("edge: direct transaction retrieval avoids collection pagination dependence", async ({
    fireflyApi,
    region,
  }, testInfo) => {
    const id = testInfo.testId;
    const asset = await fireflyApi.createAccount(createAssetAccount(region.name, id, region.currencyCode));
    const expense = await fireflyApi.createAccount(createExpenseAccount(region.name, id, region.currencyCode));

    const txData = createWithdrawal(
      asset.data.attributes.name,
      expense.data.attributes.name,
      "7.75",
      `Pagination bypass ${region.name} ${id}`,
      region.currencyCode
    );
    const created = await fireflyApi.createTransaction({ transactions: [txData] });

    // Proves we don't depend on list page position
    const direct = await fireflyApi.getTransaction(created.data.id);
    expect(direct.data.id).toBe(created.data.id);
    expect(direct.data.attributes.transactions?.[0]?.description).toBe(txData.description);
    expect(Number(direct.data.attributes.transactions?.[0]?.amount)).toBe(7.75);
  });

  test("idempotent read: same transaction returns identical fields", async ({
    fireflyApi,
    region,
  }, testInfo) => {
    const id = testInfo.testId;
    const asset = await fireflyApi.createAccount(createAssetAccount(region.name, id, region.currencyCode));
    const expense = await fireflyApi.createAccount(createExpenseAccount(region.name, id, region.currencyCode));

    const txData = createWithdrawal(
      asset.data.attributes.name,
      expense.data.attributes.name,
      "5.00",
      `Idempotent ${region.name} ${id}`,
      region.currencyCode
    );
    const created = await fireflyApi.createTransaction({ transactions: [txData] });

    const first = await fireflyApi.getTransaction(created.data.id);
    const second = await fireflyApi.getTransaction(created.data.id);

    expect(first.data.id).toBe(second.data.id);
    const a = first.data.attributes.transactions?.[0];
    const b = second.data.attributes.transactions?.[0];
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a!.description).toBe(b!.description);
    expect(a!.amount).toBe(b!.amount);
    expect(a!.type).toBe(b!.type);
  });
});
