import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth.js";
import { mockExternalNetwork } from "../helpers/checks.js";

// On mobile viewports the sidebar (which holds "Log out") is a collapsed
// off-canvas drawer, only reachable via the "Menu" toggle; on desktop the
// toggle is display:none and the sidebar is always visible.
async function clickLogout(page) {
  const menuToggle = page.getByRole("button", { name: "Menu" });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
  }
  await page.getByRole("button", { name: "Log out" }).click();
}

test("visiting /admin without a session redirects to login", async ({ page }) => {
  await mockExternalNetwork(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("logging out redirects to login", async ({ page }) => {
  await mockExternalNetwork(page);
  await loginAsAdmin(page);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  await clickLogout(page);
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("after logging out, a fresh visit to /admin (no session) redirects to login", async ({ page, context }) => {
  // Uses a separate, un-primed page in the same context (no addInitScript
  // token injection) to prove /admin genuinely requires a real session,
  // rather than reusing the page that had loginAsAdmin() called on it —
  // that init script re-injects the token on every navigation in its own
  // page, which would mask a real logout.
  await mockExternalNetwork(page);
  await loginAsAdmin(page);
  await page.goto("/admin");
  await clickLogout(page);
  await expect(page).toHaveURL(/\/admin\/login/);

  const freshPage = await context.newPage();
  await mockExternalNetwork(freshPage);
  await freshPage.goto("/admin");
  await expect(freshPage).toHaveURL(/\/admin\/login/);
  await freshPage.close();
});
