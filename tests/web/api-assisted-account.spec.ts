import { test, expect } from "../../src/fixtures/test.fixture";
import { createCustomer } from "../../src/test-data/customer.factory";
import { AccountType } from "../../src/api/clients/bank-api.client";

test.describe("ParaBank Web - API-Assisted Cross-Layer", () => {
  test("cross-layer: register via web, verify account via API, create account, verify in web", async ({
    registrationPage,
    accountsPage,
    bankApi,
    region,
    page,
  }, testInfo) => {
    const customer = createCustomer(region.name, testInfo.workerIndex.toString());

    // Step 1: Register customer through the Web UI
    await registrationPage.open();
    await registrationPage.register(customer);

    // Wait for registration success confirmation
    const successText = page.getByText(
      "Your account was created successfully"
    );
    await expect(successText).toBeVisible({ timeout: 15000 });

    // Step 2: Authenticate via API using the same customer
    const apiCustomer = await bankApi.login(
      customer.username,
      customer.password
    );
    expect(apiCustomer.firstName, "API should return same first name").toBe(
      customer.firstName
    );
    expect(apiCustomer.lastName, "API should return same last name").toBe(
      customer.lastName
    );

    // Step 3: Retrieve the customer's accounts via API
    const apiAccounts = await bankApi.getCustomerAccounts(apiCustomer.id);
    expect(
      apiAccounts.length,
      "newly registered customer should have at least one account"
    ).toBeGreaterThan(0);

    const existingAccount = apiAccounts[0];

    // Step 4: Create an additional account via API
    const newAccount = await bankApi.createAccount(
      apiCustomer.id,
      AccountType.SAVINGS,
      existingAccount.id
    );
    expect(newAccount.id, "new account should have a valid id").toBeGreaterThan(
      0
    );
    expect(newAccount.customerId).toBe(apiCustomer.id);

    // Step 5: Reload the Web account overview and verify the API-created account appears
    await accountsPage.open();
    await accountsPage.waitUntilLoaded();

    const webAccountIds = await accountsPage.getDisplayedAccountIds();
    const newAccountIdStr = String(newAccount.id);

    expect(
      webAccountIds,
      "web should display the API-created account"
    ).toContain(newAccountIdStr);
  });
});
