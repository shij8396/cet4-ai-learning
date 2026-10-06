import { pathToFileURL } from "url";

import "dotenv/config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function ensureUser(email: string, password: string, name: string) {
  const register = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!register.ok && register.status !== 409) {
    throw new Error(`Failed to register ${email}: ${register.status} ${await register.text()}`);
  }

  const login = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!login.ok) {
    throw new Error(`Failed to verify login for ${email}: ${login.status} ${await login.text()}`);
  }
}

async function main() {
  await ensureUser("test@cet4.com", "test123456", "Test User");
  await ensureUser("e2e-test@cet4.com", "E2eTest123!", "E2E Tester");
}

export default async function globalSetup() {
  await main();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("Failed to seed e2e users:", error);
    process.exit(1);
  });
}
