import type { Page, Locator } from "@playwright/test";

const WAIT_TIMEOUT = 15_000;

export class AccountsPage {
  readonly page: Page;
  private readonly baseUrl: string;

  readonly accountOverviewHeading: Locator;
  readonly accountLinks: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.accountOverviewHeading = page.getByRole("heading", {
      name: "Accounts Overview",
    });
    this.accountLinks = page.getByRole("link").filter({
      hasText: /^\d+$/,
    });
    this.logoutLink = page.getByRole("link", { name: "Log Out" });
  }

  async open(): Promise<void> {
    await this.page.goto(`${this.baseUrl}/overview.htm`);
  }

  async waitUntilLoaded(): Promise<void> {
    await this.accountLinks.first().waitFor({
      state: "visible",
      timeout: WAIT_TIMEOUT,
    });
  }

  async getDisplayedAccountIds(): Promise<string[]> {
    const links = await this.accountLinks.allTextContents();
    return links
      .map((text) => text.trim())
      .filter((text) => /^\d+$/.test(text));
  }

  accountLink(accountId: string): Locator {
    return this.page.getByRole("link", { name: accountId, exact: true });
  }

  async isLoggedIn(): Promise<boolean> {
    return this.logoutLink.isVisible();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }
}
