import { test, expect } from "../../src/fixtures/test.fixture";
import {
  createAssetAccount,
  createExpenseAccount,
} from "../../src/test-data/factories";
import { AccountCollectionSchema } from "../../src/api/models/account.schema";

test.describe("Firefly III API - Accounts", () => {
  test("happy path: create asset account and retrieve it by ID", async ({
    fireflyApi,
    region,
  }, testInfo) => {
    const accountData = createAssetAccount(region.name, testInfo.testId, region.currencyCode);

    const created = await fireflyApi.createAccount(accountData);
    expect(created.data.id).toBeTruthy();
    expect(created.data.attributes.name).toBe(accountData.name);
    expect(created.data.attributes.type).toBe("asset");
    expect(created.data.attributes.currency_code).toBe(region.currencyCode);

    const retrieved = await fireflyApi.getAccount(created.data.id);
    expect(retrieved.data.id).toBe(created.data.id);
    expect(retrieved.data.attributes.name).toBe(accountData.name);
  });

  test("happy path: list accounts returns data with valid pagination", async ({
    fireflyApi,
    region,
  }, testInfo) => {
    const accountData = createAssetAccount(region.name, testInfo.testId, region.currencyCode);
    await fireflyApi.createAccount(accountData);

    const list = await fireflyApi.listAccounts("asset");
    expect(list.data.length).toBeGreaterThan(0);
    expect(list.data.length).toBeLessThanOrEqual(50);
  });

  test("schema validation: account list passes Zod schema", async ({
    fireflyApi,
  }) => {
    const list = await fireflyApi.listAccounts();
    const result = AccountCollectionSchema.safeParse(list);
    expect(result.success, "account collection should pass schema validation").toBe(true);
  });

  test("authorization: nonexistent resource returns 401 (Firefly III v6.6.6 route-level auth)", async ({
    fireflyApi,
  }) => {
    // Firefly III v6.6.6 returns 401 AuthenticationException for nonexistent IDs in existing routes
    const response = await fireflyApi.getAccountExpectingError("99999999");
    expect(response.status).toBe(401);
    expect(response.body).toBeDefined();
    const body = response.body as Record<string, unknown>;
    expect(body.exception).toBe("AuthenticationException");
  });

  test("idempotent read: same account returns identical stable fields", async ({
    fireflyApi,
    region,
  }, testInfo) => {
    const accountData = createAssetAccount(region.name, testInfo.testId, region.currencyCode);
    const created = await fireflyApi.createAccount(accountData);

    const first = await fireflyApi.getAccount(created.data.id);
    const second = await fireflyApi.getAccount(created.data.id);

    expect(first.data.id).toBe(second.data.id);
    expect(first.data.attributes.name).toBe(second.data.attributes.name);
    expect(first.data.attributes.type).toBe(second.data.attributes.type);
    expect(first.data.attributes.currency_code).toBe(second.data.attributes.currency_code);
  });

  test("happy path: create expense account with explicit currency", async ({
    fireflyApi,
    region,
  }, testInfo) => {
    const accountData = createExpenseAccount(region.name, testInfo.testId, region.currencyCode);

    const created = await fireflyApi.createAccount(accountData);
    expect(created.data.id).toBeTruthy();
    expect(created.data.attributes.name).toBe(accountData.name);
    expect(created.data.attributes.type).toBe("expense");
    expect(created.data.attributes.currency_code).toBe(region.currencyCode);
  });

  test("currency: native user-group currency matches region configuration", async ({
    fireflyApi,
    region,
  }) => {
    const userGroups = await fireflyApi.getUserGroups();
    expect(userGroups.length).toBeGreaterThan(0);
    expect(userGroups[0].primary_currency_code).toBe(region.currencyCode);
  });
});
