import { test, expect } from "../../src/fixtures/test.fixture";

test.describe("Firefly III Web - Authentication", () => {
  test("happy path: login with valid credentials shows dashboard", async ({
    loginPage,
    dashboardPage,
    region,
  }) => {
    await loginPage.open();
    await loginPage.loginExpectingSuccess(
      region.defaultTestEmail,
      region.testUserPassword,
    );

    await dashboardPage.waitForReady();

    expect(loginPage.currentUrl()).not.toContain("/login");
    expect(loginPage.currentUrl()).not.toContain("/register");

    const navVisible = await dashboardPage.authenticatedNav.first().isVisible();
    expect(navVisible, "authenticated navigation should be visible").toBe(true);
  });

  test("error: login with invalid credentials shows error", async ({
    loginPage,
  }) => {
    await loginPage.open();
    await loginPage.loginExpectingFailure(
      "nonexistent@test.example.com",
      "wrongpassword123"
    );

    const errorVisible = await loginPage.errorMessage.first().isVisible();
    expect(errorVisible, "error message should be visible").toBe(true);

    expect(loginPage.currentUrl(), "should remain on login page").toContain("/login");
  });
});
