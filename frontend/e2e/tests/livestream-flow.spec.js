import { test, expect, request } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth.js";
import { mockExternalNetwork } from "../helpers/checks.js";

const BACKEND_URL = "http://127.0.0.1:8001";

test("turning manual live on shows the red Live badge on the homepage and /live", async ({ page }) => {
  await mockExternalNetwork(page);

  // auto_live is turned off first so the real current time (which might
  // genuinely fall inside a seeded service window) can't make this test
  // flaky — only the manual override is under test here.
  const api = await request.newContext();
  const login = await (
    await api.post(`${BACKEND_URL}/api/admin/login`, { data: { username: "admin", password: "ChangeMe123!" } })
  ).json();
  await api.put(`${BACKEND_URL}/api/livestream`, {
    headers: { Authorization: `Bearer ${login.access_token}`, "Content-Type": "application/json" },
    data: { auto_live: false, manual_live: false },
  });

  await page.goto("/");
  await expect(page.locator(".nav-live-btn")).not.toHaveClass(/is-live/);

  await loginAsAdmin(page);
  await page.goto("/admin/livestream");
  await page.getByLabel(/Manual override/).check();
  await page.getByLabel("Manual title").fill("E2E Special Service");
  await page.getByRole("button", { name: "Save Livestream Settings" }).click();
  await expect(page.getByText("Livestream settings saved.")).toBeVisible();

  await page.goto("/");
  await expect(page.locator(".nav-live-btn")).toHaveClass(/is-live/);
  await expect(page.locator(".nav-live-btn")).toContainText("E2E Special Service");

  await page.goto("/live");
  await expect(page.getByText(/Live now — E2E Special Service/)).toBeVisible();

  // turn it back off
  await page.goto("/admin/livestream");
  await page.getByLabel(/Manual override/).uncheck();
  await page.getByRole("button", { name: "Save Livestream Settings" }).click();

  await page.goto("/");
  await expect(page.locator(".nav-live-btn")).not.toHaveClass(/is-live/);
});
