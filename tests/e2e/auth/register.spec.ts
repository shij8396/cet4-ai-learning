import { test, expect } from "@playwright/test";

import { registerAs, expectToast, generateUniqueEmail } from "../utils/helpers";

test.describe("Register", () => {
  test("正常注册", async ({ page }) => {
    const email = generateUniqueEmail();
    await registerAs(page, "E2E User", email, "Test123!", "Test123!");
    await expectToast(page, "注册成功！欢迎加入");
  });

  test("重复邮箱", async ({ page }) => {
    const email = generateUniqueEmail();
    await registerAs(page, "E2E User", email, "Test123!", "Test123!");
    await page.waitForTimeout(3000);

    await page.goto("/register");
    await registerAs(page, "E2E User", email, "Test123!", "Test123!");
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/register/);
  });

  test("非法邮箱", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#email").fill("notanemail");
    await page.getByRole("button", { name: "注册" }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/register/);
  });

  test("密码长度不足", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#password").fill("12");
    await page.getByRole("button", { name: "注册" }).click();
    await expect(page.getByText("密码至少6位")).toBeVisible();
  });

  test("两次密码不一致", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#password").fill("Test123!");
    await page.locator("#confirmPassword").fill("Different1!");
    await page.getByRole("button", { name: "注册" }).click();
    await expect(page.getByText("两次密码不一致")).toBeVisible();
  });
});
