import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth.js";
import { mockExternalNetwork } from "../helpers/checks.js";

test("add a Copperbelt branch, find it publicly, edit its phone, hide it, then delete it", async ({ page }) => {
  await mockExternalNetwork(page);
  await loginAsAdmin(page);

  const branchName = `E2E Test Branch ${Date.now()}`;

  // --- add ---
  await page.goto("/admin/branches");
  await page.getByRole("button", { name: "Add Branch" }).click();
  await page.getByLabel("Branch name *").fill(branchName);
  await page.getByLabel("Province *").selectOption("Copperbelt");
  await page.getByLabel("Town").fill("Kitwe");
  await page.getByLabel("Pastor / leader name *").fill("E2E Pastor");
  await page.getByLabel("Pastor phone").fill("0971234567");
  await page.getByLabel("Pastor WhatsApp").fill("0971234567");
  await page.locator('input[aria-label="Google Maps link or coordinates"]').fill("-12.8024,28.2132");
  await page.getByRole("button", { name: "Set pin" }).click();
  await page.getByRole("button", { name: "Save Branch" }).click();
  await expect(page.getByText("Branch added.")).toBeVisible();

  // --- appears publicly, filterable by province ---
  await page.goto("/locations");
  await expect(page.getByText(branchName)).toBeVisible();

  await page.getByRole("combobox").nth(1).selectOption("Copperbelt"); // province filter
  await expect(page.getByText(branchName)).toBeVisible();

  // --- edit the phone, confirm the WhatsApp link changes ---
  await page.goto("/admin/branches");
  const row = page.locator(".admin-list-row", { hasText: branchName });
  await row.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Pastor WhatsApp").fill("0969876543");
  await page.getByRole("button", { name: "Save Branch" }).click();
  await expect(page.getByText("Branch updated.")).toBeVisible();

  const slug = branchName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  await page.goto(`/locations/${slug}`);
  const whatsappLink = page.getByRole("link", { name: "WhatsApp" });
  await expect(whatsappLink).toHaveAttribute("href", /260969876543/);

  // --- hide it, confirm it disappears publicly ---
  await page.goto("/admin/branches");
  await page.locator(".admin-list-row", { hasText: branchName }).getByRole("button", { name: "Edit" }).click();
  await page.getByLabel(/Visible on the public site/).uncheck();
  await page.getByRole("button", { name: "Save Branch" }).click();

  await page.goto("/locations");
  await expect(page.getByText(branchName)).not.toBeVisible();

  // --- delete it ---
  await page.goto("/admin/branches");
  const hiddenRow = page.locator(".admin-list-row", { hasText: branchName });
  await hiddenRow.getByRole("button", { name: "Remove" }).click();
  await hiddenRow.getByRole("button", { name: "Confirm remove" }).click();
  await expect(page.locator(".admin-list-row", { hasText: branchName })).toHaveCount(0);
});
