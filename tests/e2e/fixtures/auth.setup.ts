import path from "path";

import { test as setup } from "@playwright/test";

import { loginWithFastApi } from "../utils/helpers";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate test user", async ({ page }) => {
  await loginWithFastApi(page);
  await page.context().storageState({ path: AUTH_FILE });
});
