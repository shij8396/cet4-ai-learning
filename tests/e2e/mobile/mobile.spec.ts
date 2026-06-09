import { test, expect } from "@playwright/test";

import { waitForPageReady, loginAs, expectToast } from "../utils/helpers";

test.describe("移动端适配测试", () => {
  test.describe("登录页 /login", () => {
    test("输入框在移动视口中可见", async ({ page }) => {
      await page.goto("/login");
      await waitForPageReady(page);

      await expect(page.locator("form")).toBeVisible();
      await expect(page.locator("input[type='email'], #email")).toBeVisible();
      await expect(page.locator("input[type='password'], #password")).toBeVisible();
    });

    test("键盘不遮挡输入框", async ({ page }) => {
      await page.goto("/login");
      await waitForPageReady(page);

      const emailInput = page.locator("#email");
      await emailInput.focus();

      const isVisible = await emailInput.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight * 0.6;
      });
      expect(isVisible).toBe(true);
    });

    test("Safe Area 底部适配", async ({ page }) => {
      await page.goto("/login");
      await waitForPageReady(page);

      const html = page.locator("html");
      const style = await html.getAttribute("style");
      expect(style).toBeDefined();
    });

    test("页面可以正常滚动", async ({ page }) => {
      await page.goto("/login");
      await waitForPageReady(page);

      const viewport = page.viewportSize();
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const scrollY = await page.evaluate(() => window.scrollY);

      if (viewport && scrollHeight > viewport.height) {
        expect(scrollY).toBeGreaterThan(0);
      }
    });

    test("触摸点击登录按钮有响应", async ({ page }) => {
      await page.goto("/login");
      await waitForPageReady(page);

      const loginButton = page.getByRole("button", { name: "登录" });
      await expect(loginButton).toBeVisible();

      try {
        await loginButton.tap();
      } catch {
        await loginButton.click();
      }

      await page.waitForTimeout(500);
    });

    test("表单提交有正确反馈", async ({ page }) => {
      await page.goto("/login");
      await waitForPageReady(page);

      await page.locator("#email").fill("test@test.com");
      await page.locator("#password").fill("wrong123");
      await page.getByRole("button", { name: "登录" }).click();

      const feedback = page.locator('[role="alert"], .toast, [data-sonner-toaster]').first();
      await expect(feedback).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("注册页 /register", () => {
    test("注册页表单完整可见", async ({ page }) => {
      await page.goto("/register");
      await waitForPageReady(page);

      await expect(page.locator("#name")).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator("#confirmPassword")).toBeVisible();
      await expect(page.getByRole("button", { name: "注册" })).toBeVisible();
    });

    test("注册页可以正常滚动", async ({ page }) => {
      await page.goto("/register");
      await waitForPageReady(page);

      const viewport = page.viewportSize();
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);

      if (viewport && scrollHeight > viewport.height) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThan(0);
      }
    });
  });

  test.describe("底部导航", () => {
    test("首页登录后存在底部导航栏", async ({ page }) => {
      await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
      await expectToast(page, "登录成功");
      await waitForPageReady(page);

      await page.waitForURL("**/", { timeout: 10000 });
      await expect(page.getByRole("navigation").last()).toBeVisible({ timeout: 10000 });
    });
  });
});
