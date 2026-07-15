import type { Page, Locator } from "@playwright/test";
import type { CustomerData } from "../../test-data/customer.factory";

export class RegistrationPage {
  readonly page: Page;
  private readonly baseUrl: string;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly ssnInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatedPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.firstNameInput = page.locator("#customer\\.firstName");
    this.lastNameInput = page.locator("#customer\\.lastName");
    this.streetInput = page.locator("#customer\\.address\\.street");
    this.cityInput = page.locator("#customer\\.address\\.city");
    this.stateInput = page.locator("#customer\\.address\\.state");
    this.zipCodeInput = page.locator("#customer\\.address\\.zipCode");
    this.phoneNumberInput = page.locator("#customer\\.phoneNumber");
    this.ssnInput = page.locator("#customer\\.ssn");
    this.usernameInput = page.locator("#customer\\.username");
    this.passwordInput = page.locator("#customer\\.password");
    this.repeatedPasswordInput = page.locator("#repeatedPassword");
    this.registerButton = page.locator("input[value='Register']");
    this.errorMessage = page.locator(".error");
  }

  async open(): Promise<void> {
    await this.page.goto(`${this.baseUrl}/register.htm`);
  }

  async register(customer: CustomerData): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.streetInput.fill(customer.street);
    await this.cityInput.fill(customer.city);
    await this.stateInput.fill(customer.state);
    await this.zipCodeInput.fill(customer.zipCode);
    await this.phoneNumberInput.fill(customer.phoneNumber);
    await this.ssnInput.fill(customer.ssn);
    await this.usernameInput.fill(customer.username);
    await this.passwordInput.fill(customer.password);
    await this.repeatedPasswordInput.fill(customer.repeatedPassword);
    await this.registerButton.click();
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? "";
  }
}
