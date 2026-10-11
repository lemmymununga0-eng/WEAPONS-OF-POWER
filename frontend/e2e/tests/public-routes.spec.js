import { test, expect, request } from "@playwright/test";
import { trackConsoleErrors, hasHorizontalOverflow, mockExternalNetwork } from "../helpers/checks.js";
import AxeBuilder from "@axe-core/playwright";

const BACKEND_URL = "http://127.0.0.1:8001";

const PUBLIC_ROUTES = ["/", "/about", "/services", "/ministries", "/giving", "/prayer", "/media", "/contact", "/events", "/sermons", "/live", "/locations", "/this-page-does-not-exist"];

test.describe("Public routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} loads with no console errors and no horizontal overflow`, async ({ page }) => {
      await mockExternalNetwork(page);
      const errors = trackConsoleErrors(page);

      await page.goto(route);
      await page.waitForLoadState("networkidle");

      expect(errors, `console errors on ${route}: ${errors.join("; ")}`).toEqual([]);
      expect(await hasHorizontalOverflow(page), `horizontal overflow on ${route}`).toBe(false);
    });
  }

  test("branch detail page loads for the seeded headquarters branch", async ({ page }) => {
    const api = await request.newContext();
    const branches = await (await api.get(`${BACKEND_URL}/api/branches`)).json();
    expect(branches.length).toBeGreaterThan(0);
    const slug = branches[0].slug;

    await mockExternalNetwork(page);
    const errors = trackConsoleErrors(page);
    await page.goto(`/locations/${slug}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h2")).toContainText(branches[0].name);
    expect(errors).toEqual([]);
  });

  test("sermon detail page loads for a published sermon", async ({ page }) => {
    const api = await request.newContext();
    const login = await (
      await api.post(`${BACKEND_URL}/api/admin/login`, {
        data: { username: "admin", password: "ChangeMe123!" },
      })
    ).json();

    const created = await (
      await api.post(`${BACKEND_URL}/api/sermons`, {
        headers: { Authorization: `Bearer ${login.access_token}` },
        multipart: { title: "E2E Test Sermon", speaker: "Test Speaker", published: "true" },
      })
    ).json();

    await mockExternalNetwork(page);
    await page.goto(`/sermons/${created.id}`);
    await expect(page.locator("h2")).toContainText("E2E Test Sermon");
  });

  test("navigating a 404 route shows the not-found page with a link home", async ({ page }) => {
    await mockExternalNetwork(page);
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL("/");
  });

  test("homepage has no serious or critical accessibility violations", async ({ page }) => {
    await mockExternalNetwork(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("locations page has no serious or critical accessibility violations", async ({ page }) => {
    await mockExternalNetwork(page);
    await page.goto("/locations");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
