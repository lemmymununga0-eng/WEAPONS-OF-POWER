import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth.js";
import { mockExternalNetwork } from "../helpers/checks.js";

test("submitting the contact form, then marking it read and deleting it in admin", async ({ page }) => {
  await mockExternalNetwork(page);

  const uniqueName = `E2E Tester ${Date.now()}`;

  await page.goto("/#contact");
  await page.getByLabel("Name").fill(uniqueName);
  await page.getByLabel("Phone or email").fill("e2e@example.com");
  await page.getByLabel("Message").fill("This is an end-to-end test message.");
  await page.getByRole("button", { name: "Send Message" }).click();

  await expect(page.getByText("Thank you — your message has been sent.")).toBeVisible();

  await loginAsAdmin(page);
  await page.goto("/admin/messages");

  const row = page.locator(".admin-list-row", { hasText: uniqueName });
  await expect(row).toBeVisible();
  await expect(row.getByText("Unread")).toBeVisible();

  await row.getByRole("button", { name: "Mark read" }).click();
  await expect(row.getByText("Unread")).not.toBeVisible();

  await row.getByRole("button", { name: "Delete" }).click();
  await row.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.locator(".admin-list-row", { hasText: uniqueName })).toHaveCount(0);
});
