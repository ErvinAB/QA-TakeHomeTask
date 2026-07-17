import { test as base, type APIRequestContext } from "@playwright/test";
import { loadRegion, resolveToken } from "../config/region.loader";
import type { RegionConfig } from "../config/region.types";
import { FireflyApiClient } from "../api/clients/firefly-api.client";
import { LoginPage } from "../web/pages/login.page";
import { DashboardPage } from "../web/pages/dashboard.page";
import { AccountsPage } from "../web/pages/accounts.page";

type FireflyFixtures = {
  region: RegionConfig;
  apiToken: string;
  apiContext: APIRequestContext;
  fireflyApi: FireflyApiClient;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  accountsPage: AccountsPage;
};

const resolvedRegion = loadRegion();

export const test = base.extend<FireflyFixtures>({
  region: async ({}, use) => {
    await use(resolvedRegion);
  },

  apiToken: async ({}, use) => {
    const token = resolveToken(resolvedRegion);
    await use(token);
  },

  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext();
    await use(apiContext);
    await apiContext.dispose();
  },

  fireflyApi: async ({ apiContext, apiToken }, use) => {
    const client = new FireflyApiClient(
      apiContext,
      resolvedRegion.apiBaseUrl,
      apiToken
    );
    await use(client);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page, resolvedRegion.webBaseUrl);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page, resolvedRegion.webBaseUrl);
    await use(dashboardPage);
  },

  accountsPage: async ({ page }, use) => {
    const accountsPage = new AccountsPage(page, resolvedRegion.webBaseUrl);
    await use(accountsPage);
  },
});

export { expect } from "@playwright/test";
