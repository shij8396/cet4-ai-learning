import { expect, test } from "@playwright/test";

import { expectToast, expectUrl, loginAs } from "../utils/helpers";

test.describe("Login", () => {
  test("logs in with valid credentials", async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectToast(page, "登录成功");
    await expectUrl(page, "/");
  });

  test("stays on login page with an invalid password", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("e2e-test@cet4.com");
    await page.getByTestId("login-password").fill("WrongPassword1!");
    await page.getByTestId("login-submit").click();

    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
  });

  test("keeps the session after reload", async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectUrl(page, "/");
    await page.reload();
    await page.waitForURL("**/", { timeout: 10000 });
  });

  test("redirects protected pages to login when signed out", async ({ page }) => {
    await page.goto("/reading");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows validation errors for empty form submission", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-submit").click();
    await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible();
    await expect(page.getByText("密码至少 6 位")).toBeVisible();
  });
});
