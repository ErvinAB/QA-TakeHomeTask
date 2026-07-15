import { test, expect } from "../../src/fixtures/test.fixture";

test.describe("ParaBank Web - Authentication", () => {
  test("happy path: login with valid credentials shows account overview", async ({
    loginPage,
    accountsPage,
    region,
  }) => {
    await loginPage.open();
    await loginPage.login(
      region.credentials.username,
      region.credentials.password
    );

    await accountsPage.waitUntilLoaded();

    const accountIds = await accountsPage.getDisplayedAccountIds();
    expect(accountIds.length, "should display at least one account").toBeGreaterThan(0);

    const isLoggedIn = await accountsPage.isLoggedIn();
    expect(isLoggedIn, "logout link should be visible, indicating logged-in state").toBe(true);
  });

  test("error: login with invalid credentials shows error message", async ({
    loginPage,
    accountsPage,
  }) => {
    await loginPage.open();
    await loginPage.login("nonexistent_user_xyz_999", "wrong_password_xyz_999");

    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain(
      "The username and password could not be verified"
    );

    const isLoggedIn = await accountsPage.isLoggedIn();
    expect(isLoggedIn, "should not be logged in").toBe(false);
  });
});
