// Deletes any leftover e2e test database/uploads, then starts the FastAPI
// backend against a fresh one — "against the real running backend with a
// seeded test database" per the spec, not the dev/production Supabase DB.
import { existsSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, ".tmp", "e2e-test.db");
const uploadsDir = path.join(__dirname, ".tmp", "uploads");

if (existsSync(dbPath)) rmSync(dbPath);
if (existsSync(uploadsDir)) rmSync(uploadsDir, { recursive: true, force: true });

const backendDir = path.resolve(__dirname, "..", "..", "backend");
const pythonBin = path.join(backendDir, ".venv", "Scripts", "python.exe");

const child = spawn(pythonBin, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"], {
  cwd: backendDir,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: `sqlite:///${dbPath}`,
    UPLOADS_DIR: uploadsDir,
    SECRET_KEY: "e2e-test-secret",
    ALLOWED_ORIGINS: "http://127.0.0.1:5174",
    SEED_EXAMPLES: "false",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill());
process.on("SIGINT", () => child.kill());
