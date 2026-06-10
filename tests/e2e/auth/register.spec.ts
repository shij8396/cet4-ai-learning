import { expect, test } from "@playwright/test";

import { expectToast, generateUniqueEmail, registerAs } from "../utils/helpers";

test.describe("Register", () => {
  test("registers a new user", async ({ page }) => {
    const email = generateUniqueEmail();
    await registerAs(page, "E2E User", email, "Test123!", "Test123!");
    await expectToast(page, "注册成功，欢迎加入");
  });

  test("rejects duplicate email", async ({ page }) => {
    const email = generateUniqueEmail();
    await registerAs(page, "E2E User", email, "Test123!", "Test123!");
    await expectToast(page, "注册成功，欢迎加入");

    await page.goto("/register");
    await registerAs(page, "E2E User", email, "Test123!", "Test123!");
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/register/);
  });

  test("rejects invalid email", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("register-email").fill("notanemail");
    await page.getByTestId("register-submit").click();
    await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible();
  });

  test("rejects short password", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("register-password").fill("12");
    await page.getByTestId("register-submit").click();
    await expect(page.getByText("密码至少 6 位")).toBeVisible();
  });

  test("rejects mismatched passwords", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("register-name").fill("E2E User");
    await page.getByTestId("register-email").fill(generateUniqueEmail());
    await page.getByTestId("register-password").fill("Test123!");
    await page.getByTestId("register-confirm-password").fill("Different1!");
    await page.getByTestId("register-submit").click();
    await expect(page.getByText("两次密码不一致")).toBeVisible();
  });
});
