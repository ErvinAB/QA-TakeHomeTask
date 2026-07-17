import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  private readonly baseUrl: string;

  readonly heading: Locator;
  readonly authenticatedNav: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.heading = page.getByRole("heading", { level: 1 });
    // Firefly III v6.6.6 dashboard has a nav element with sidebar-toggle for authenticated users
    this.authenticatedNav = page.locator("nav.navbar .sidebar-toggle");
  }

  async open(): Promise<void> {
    await this.page.goto(`${this.baseUrl}/`, { waitUntil: "networkidle" });
  }

  async waitForLoad(): Promise<void> {
    await this.heading.first().waitFor({ state: "visible", timeout: 15_000 });
  }

  async waitForReady(): Promise<void> {
    await this.heading.first().waitFor({ state: "visible", timeout: 15_000 });
    await this.authenticatedNav.first().waitFor({ state: "visible", timeout: 10_000 });
  }
}
