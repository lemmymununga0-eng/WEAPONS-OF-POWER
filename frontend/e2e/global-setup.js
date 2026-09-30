// Signs in once via the API (not the UI — faster, and never touches the
// login rate limiter through repeated attempts) and saves the token so
// every test file can reuse it. Playwright's built-in storageState only
// captures cookies + localStorage, not sessionStorage (which is what
// AuthContext uses), so tokens are injected manually via addInitScript
// in e2e/helpers/auth.js instead.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_URL = "http://127.0.0.1:8001";

export default async function globalSetup() {
  const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "ChangeMe123!" }),
  });
  if (!res.ok) {
    throw new Error(`Global setup: admin login failed with status ${res.status}`);
  }
  const { access_token } = await res.json();

  mkdirSync(path.join(__dirname, ".tmp"), { recursive: true });
  writeFileSync(path.join(__dirname, ".tmp", "admin-token.json"), JSON.stringify({ token: access_token }));
}
