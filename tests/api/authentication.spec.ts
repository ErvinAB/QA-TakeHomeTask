import { test, expect } from "../../src/fixtures/test.fixture";

test.describe("ParaBank API - Authentication", () => {
  test("happy path: login with valid credentials returns customer", async ({
    bankApi,
    region,
  }) => {
    const customer = await bankApi.login(
      region.credentials.username,
      region.credentials.password
    );

    expect(customer.id, "customer.id should be a positive integer").toBeGreaterThan(0);
    expect(customer.firstName).toBeTruthy();
    expect(customer.lastName).toBeTruthy();
    expect(customer.address).toBeDefined();
    expect(customer.address.street).toBeTruthy();
    expect(customer.address.city).toBeTruthy();
    expect(customer.phoneNumber).toBeTruthy();
  });

  test("error: login with invalid credentials returns 400", async ({
    bankApi,
  }) => {
    const response = await bankApi.loginExpectingError(
      "nonexistent_user_98765",
      "wrong_password_98765"
    );

    expect(response.status).toBe(400);
    expect(response.body).toContain("Invalid username and/or password");
  });

  test("error: get nonexistent customer returns 400", async ({ bankApi }) => {
    const response = await bankApi.getCustomerExpectingError(99999999);

    expect(response.status).toBe(400);
    expect(response.body).toContain("Could not find customer");
  });
});
