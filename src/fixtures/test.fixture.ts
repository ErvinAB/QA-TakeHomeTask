import { test as base, type APIRequestContext } from "@playwright/test";
import { loadRegion } from "../config/region.loader";
import type { RegionConfig } from "../config/region.types";
import { BankApiClient } from "../api/clients/bank-api.client";
import { LoginPage } from "../web/pages/login.page";
import { RegistrationPage } from "../web/pages/registration.page";
import { AccountsPage } from "../web/pages/accounts.page";

type BankFixtures = {
  region: RegionConfig;
  apiContext: APIRequestContext;
  bankApi: BankApiClient;
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  accountsPage: AccountsPage;
};

const resolvedRegion = loadRegion();

export const test = base.extend<BankFixtures>({
  region: async ({}, use) => {
    await use(resolvedRegion);
  },

  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      extraHTTPHeaders: {
        Accept: "application/json",
      },
    });
    await use(apiContext);
    await apiContext.dispose();
  },

  bankApi: async ({ apiContext }, use) => {
    const bankApi = new BankApiClient(apiContext, resolvedRegion.apiBaseUrl);
    await use(bankApi);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page, resolvedRegion.webBaseUrl);
    await use(loginPage);
  },

  registrationPage: async ({ page }, use) => {
    const registrationPage = new RegistrationPage(
      page,
      resolvedRegion.webBaseUrl
    );
    await use(registrationPage);
  },

  accountsPage: async ({ page }, use) => {
    const accountsPage = new AccountsPage(page, resolvedRegion.webBaseUrl);
    await use(accountsPage);
  },
});

export { expect } from "@playwright/test";
