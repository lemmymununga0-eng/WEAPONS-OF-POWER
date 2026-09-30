import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loginAsAdmin } from "../helpers/auth.js";
import { mockExternalNetwork } from "../helpers/checks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve(__dirname, "..", "..", "..", "docs", "screenshots");

const PUBLIC_SCREENS = [
  ["home", "/"],
  ["events", "/events"],
  ["sermons", "/sermons"],
  ["live", "/live"],
  ["locations", "/locations"],
  ["not-found", "/this-page-does-not-exist"],
];

const ADMIN_SCREENS = [
  ["admin-overview", "/admin"],
  ["admin-church-info", "/admin/church-info"],
  ["admin-ministries", "/admin/ministries"],
  ["admin-events", "/admin/events"],
  ["admin-sermons", "/admin/sermons"],
  ["admin-branches", "/admin/branches"],
  ["admin-livestream", "/admin/livestream"],
  ["admin-messages", "/admin/messages"],
  ["admin-account", "/admin/account"],
];

test.describe("Screenshots", () => {
  for (const [name, route] of PUBLIC_SCREENS) {
    test(`capture ${name}`, async ({ page }, testInfo) => {
      await mockExternalNetwork(page);
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const width = testInfo.project.use.viewport.width;
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}-${width}.png`), fullPage: true });
    });
  }

  for (const [name, route] of ADMIN_SCREENS) {
    test(`capture ${name}`, async ({ page }, testInfo) => {
      await mockExternalNetwork(page);
      await loginAsAdmin(page);
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const width = testInfo.project.use.viewport.width;
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}-${width}.png`), fullPage: true });
    });
  }
});
