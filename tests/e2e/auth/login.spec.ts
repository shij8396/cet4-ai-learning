import { test, expect } from "@playwright/test";

import { loginAs, expectToast, expectUrl } from "../utils/helpers";

test.describe("Login", () => {
  test("正确登录", async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectToast(page, "登录成功");
    await expectUrl(page, "/");
  });

  test("错误密码", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("e2e-test@cet4.com");
    await page.locator("#password").fill("WrongPassword1!");
    await page.getByRole("button", { name: "登录" }).click();

    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
    const currentUrl = page.url();
    expect(currentUrl).toContain("/login");
  });

  test("Session保持", async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectUrl(page, "/");
    await page.reload();
    await page.waitForURL("**/", { timeout: 10000 });
  });

  test("自动跳转", async ({ page }) => {
    await page.goto("/reading");
    await expect(page).toHaveURL(/\/login/);
  });

  test("空表单提交验证错误", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "登录" }).click();
    await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible();
    await expect(page.getByText("密码至少6位")).toBeVisible();
  });
});
