import { test, expect } from "../../src/fixtures/test.fixture";
import { createCustomer } from "../../src/test-data/customer.factory";

test.describe("ParaBank Web - Registration", () => {
  test("edge case: duplicate registration rejects with error", async ({
    registrationPage,
    region,
    page,
  }, testInfo) => {
    const customer = createCustomer(region.name, testInfo.workerIndex.toString());

    // First registration succeeds
    await registrationPage.open();
    await registrationPage.register(customer);

    const successText = page.getByText(
      "Your account was created successfully"
    );
    await expect(successText).toBeVisible({ timeout: 10000 });

    // Attempt duplicate registration with the same username
    await registrationPage.open();
    await registrationPage.register(customer);

    // The system should reject the duplicate
    const errorVisible = await registrationPage.errorMessage.isVisible();
    const errorTitleVisible = await page
      .getByText("Error")
      .isVisible();

    expect(
      errorVisible || errorTitleVisible,
      "duplicate registration should be rejected with an error"
    ).toBe(true);
  });
});
