import { test, expect } from "../../src/fixtures/test.fixture";
import {
  createAssetAccount,
  createWithdrawal,
} from "../../src/test-data/factories";

test.describe("Firefly III Web - Cross-Layer", () => {
  test("cross-layer: create account and transaction via API, verify in web", async ({
    loginPage,
    dashboardPage,
    accountsPage,
    fireflyApi,
    region,
  }, testInfo) => {
    const id = testInfo.testId.replace(/[^a-zA-Z0-9]/g, "").slice(-12);

    const assetData = createAssetAccount(
      region.name, id, region.currencyCode
    );
    const asset = await fireflyApi.createAccount(assetData);
    const accountId = asset.data.id;

    const txData = createWithdrawal(
      asset.data.attributes.name,
      "Cross-Layer Expense",
      "42.00",
      `Cross-layer ${region.name} ${id}`,
      region.currencyCode
    );
    await fireflyApi.createTransaction({
      transactions: [txData],
    });

    await loginPage.open();
    await loginPage.loginExpectingSuccess(
      region.defaultTestEmail,
      region.testUserPassword
    );
    await dashboardPage.waitForLoad();

    await accountsPage.openAccountDetail(accountId);

    await expect(accountsPage.accountName(asset.data.attributes.name)).toBeVisible({ timeout: 10_000 });

    const txRow = accountsPage.transactionRowsContaining(txData.description);
    await expect(txRow).toHaveCount(1, { timeout: 10_000 });
    await expect(txRow).toContainText("42");
    await expect(txRow).toContainText("Cross-Layer Expense");
  });

  test("edge case: new account shows zero transactions", async ({
    loginPage,
    dashboardPage,
    accountsPage,
    fireflyApi,
    region,
  }, testInfo) => {
    const id = testInfo.testId.replace(/[^a-zA-Z0-9]/g, "").slice(-12);

    const assetData = createAssetAccount(
      region.name, id, region.currencyCode
    );
    const asset = await fireflyApi.createAccount(assetData);
    const accountId = asset.data.id;

    await loginPage.open();
    await loginPage.loginExpectingSuccess(
      region.defaultTestEmail,
      region.testUserPassword
    );
    await dashboardPage.waitForLoad();

    await accountsPage.openAccountDetail(accountId);

    const rowCount = await accountsPage.transactionRows().count();
    expect(
      rowCount,
      "newly created account should have no transactions"
    ).toBe(0);
  });
});
