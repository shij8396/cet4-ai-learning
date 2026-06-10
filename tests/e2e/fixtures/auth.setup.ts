import path from "path";

import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate test user", async ({ page }) => {
  await page.goto("/login");

  await page.getByTestId("login-email").fill("test@cet4.com");
  await page.getByTestId("login-password").fill("test123456");
  await page.getByTestId("login-submit").click();

  await expect(page.getByText("登录成功")).toBeVisible({ timeout: 10000 });
  await page.waitForURL("**/", { timeout: 10000 });

  await page.context().storageState({ path: AUTH_FILE });
});
