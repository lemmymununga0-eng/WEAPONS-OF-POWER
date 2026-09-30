import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAdminToken() {
  const raw = readFileSync(path.join(__dirname, "..", ".tmp", "admin-token.json"), "utf-8");
  return JSON.parse(raw).token;
}

/** Injects the admin token into sessionStorage before any page script
 * runs, so the app treats the browser as already signed in. */
export async function loginAsAdmin(page) {
  const token = getAdminToken();
  await page.addInitScript((t) => {
    window.sessionStorage.setItem("wopmi_admin_token", t);
  }, token);
}
