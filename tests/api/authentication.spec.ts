import { test, expect } from "../../src/fixtures/test.fixture";

test.describe("Firefly III API - Authentication", () => {
  test("happy path: about endpoint returns system info", async ({
    fireflyApi,
  }) => {
    const about = await fireflyApi.getAbout();
    expect(about.data.version).toBeTruthy();
    expect(about.data.api_version).toBeTruthy();
    expect(about.data.os).toBeTruthy();
  });

  test("happy path: current user endpoint returns authenticated user", async ({
    fireflyApi,
    region,
  }) => {
    const user = await fireflyApi.getCurrentUser();
    expect(user.data.type).toBe("users");
    expect(user.data.attributes.email).toBe(region.defaultTestEmail);
    expect(user.data.attributes.role).toBe("owner");
    expect(user.data.attributes.blocked).toBe(false);
  });

  test("error: missing bearer token returns 401", async ({
    fireflyApi,
  }) => {
    const response = await fireflyApi.missingTokenGetAbout();
    expect(response.status).toBe(401);
    expect(typeof response.body.message).toBe("string");
    expect(response.body.message.length).toBeGreaterThan(0);
    expect(typeof response.body.exception).toBe("string");
    expect(response.body.exception.length).toBeGreaterThan(0);
  });

  test("error: invalid bearer token returns 401", async ({
    fireflyApi,
  }) => {
    const response = await fireflyApi.invalidTokenGetAbout();
    expect(response.status).toBe(401);
    expect(typeof response.body.message).toBe("string");
    expect(response.body.message.length).toBeGreaterThan(0);
    expect(typeof response.body.exception).toBe("string");
    expect(response.body.exception.length).toBeGreaterThan(0);
  });
});
