import path from "path";

import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("认证设置", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("邮箱").fill("test@cet4.com");
  await page.getByLabel("密码").fill("test123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByText("登录成功")).toBeVisible({ timeout: 10000 });
  await page.waitForURL("**/", { timeout: 10000 });

  await page.context().storageState({ path: AUTH_FILE });
});
