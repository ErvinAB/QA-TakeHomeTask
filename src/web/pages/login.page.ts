import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly baseUrl: string;

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.emailInput = page.locator('input[name="email"], input[name="username"]').first();
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByRole("button", { name: /login|sign.?in|submit/i });
    this.errorMessage = page.locator(".notification-error, .alert-danger, [role='alert']");
  }

  async open(): Promise<void> {
    await this.page.goto(`${this.baseUrl}/login`, { waitUntil: "networkidle" });
  }

  async loginExpectingSuccess(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL((url) => !url.pathname.includes("/login") && !url.pathname.includes("/register"), { timeout: 15_000 });
    await this.page.waitForLoadState("domcontentloaded");
  }

  async loginExpectingFailure(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.errorMessage.first().waitFor({ state: "visible", timeout: 10_000 });
  }

  currentUrl(): string {
    return this.page.url();
  }
}
