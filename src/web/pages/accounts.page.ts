import type { Page, Locator } from "@playwright/test";

const WAIT_TIMEOUT = 15_000;

export class AccountsPage {
  readonly page: Page;
  readonly baseUrl: string;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async openAccountDetail(accountId: string): Promise<void> {
    await this.page.goto(
      `${this.baseUrl}/accounts/show/${accountId}`,
      { waitUntil: "networkidle" }
    );
    await this.page.getByRole("heading", { name: /accounts/i }).first()
      .waitFor({ state: "visible", timeout: WAIT_TIMEOUT });
  }

  accountName(name: string): Locator {
    return this.page.getByText(name).first();
  }

  // Scoped to the account activity table (v6.6.6: .table-condensed inside .box-body)
  transactionRows(): Locator {
    return this.page.locator(".box-body .table-condensed tbody tr");
  }

  transactionRowsContaining(description: string): Locator {
    return this.page.locator(".box-body .table-condensed tbody tr", { hasText: description });
  }
}
