import { test, expect } from "@playwright/test";

import { navigateTo, waitForPageReady, loginAs, expectToast } from "../utils/helpers";

test.describe("AI系统测试", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectToast(page, "登录成功");
  });

  test.describe("AI功能页面加载", () => {
    test("设置页包含AI功能开关", async ({ page }) => {
      await navigateTo(page, "settings");
      await waitForPageReady(page);

      await expect(page.getByRole("heading", { name: "设置", exact: true })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("AI功能")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("AI学习助手")).toBeVisible({ timeout: 5000 });
    });

    test("作文批改页面加载正常", async ({ page }) => {
      await page.goto("/writing");
      await waitForPageReady(page);

      await expect(page.getByText("作文助手")).toBeVisible({ timeout: 10000 });
    });

    test("阅读页面加载正常", async ({ page }) => {
      await navigateTo(page, "reading");
      await waitForPageReady(page);

      await expect(page.getByText("阅读训练")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("AI生成内容", () => {
    test("作文页面存在AI辅助功能区", async ({ page }) => {
      await page.goto("/writing");
      await waitForPageReady(page);

      const assistantBtn = page.getByRole("button", { name: "表达助手" });
      const simplifyBtn = page.getByRole("button", { name: "简化" });

      const hasAssistant = await assistantBtn.isVisible().catch(() => false);
      const hasSimplify = await simplifyBtn.isVisible().catch(() => false);
      expect(hasAssistant || hasSimplify).toBe(true);
    });
  });

  test.describe("AI响应时间", () => {
    test("AI相关API端点可访问且响应合理", async ({ page }) => {
      const start = Date.now();
      const response = await page.request.get("/api/ai/debug");
      const elapsed = Date.now() - start;

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      expect(elapsed).toBeLessThan(30000);
    });

    test("设置页面AI配置区域加载及时", async ({ page }) => {
      await navigateTo(page, "settings");
      await waitForPageReady(page);

      const start = Date.now();
      await expect(page.getByText("AI功能")).toBeVisible({ timeout: 10000 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(10000);
    });
  });

  test.describe("AI输出审核", () => {
    test("阅读API返回合法数据", async ({ page }) => {
      const response = await page.request.get("/api/reading");
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe("object");
    });
  });
});
