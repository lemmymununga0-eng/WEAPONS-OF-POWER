import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONTEND_URL = "http://127.0.0.1:5174";
const BACKEND_URL = "http://127.0.0.1:8001";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.js",
  fullyParallel: false,
  workers: 1, // all test files share one backend/database instance — must run sequentially, not racing each other
  retries: 0,
  timeout: 60000,
  reporter: [["list"]],
  use: {
    baseURL: FRONTEND_URL,
    screenshot: "only-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  expect: {
    timeout: 10000,
  },
  webServer: [
    {
      command: `node e2e/start-backend.mjs`,
      cwd: __dirname,
      url: `${BACKEND_URL}/api/health`,
      timeout: 60000,
      reuseExistingServer: false,
    },
    {
      command: `"${path.join(__dirname, "node_modules", ".bin", "vite.cmd")}" --port 5174 --host 127.0.0.1`,
      cwd: __dirname,
      url: FRONTEND_URL,
      timeout: 30000,
      reuseExistingServer: false,
      env: {
        VITE_API_BASE: BACKEND_URL,
      },
    },
  ],
  projects: [
    {
      name: "desktop",
      testDir: "./e2e/tests",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "pixel7",
      testDir: "./e2e/tests",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "iphone13",
      testDir: "./e2e/tests",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "screenshots-desktop",
      testDir: "./e2e/screenshots",
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "screenshots-mobile",
      testDir: "./e2e/screenshots",
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});
