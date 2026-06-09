import { test, expect } from "@playwright/test";

import { navigateTo, waitForPageReady, loginAs, expectToast } from "../utils/helpers";

test.describe("默写功能测试", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectToast(page, "登录成功");
  });

  test("页面加载", async ({ page }) => {
    await navigateTo(page, "dictation");
    await waitForPageReady(page);

    await expect(page.getByText("单词默写")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("选择默写模式")).toBeVisible({ timeout: 10000 });
  });

  test("单词列表加载与模式切换", async ({ page }) => {
    await navigateTo(page, "dictation");
    await waitForPageReady(page);

    await expect(page.getByText("选择默写模式")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("中文→英文")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("听力→拼写")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("例句填空")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("错词强化")).toBeVisible({ timeout: 5000 });
  });

  test("中文→英文模式默写", async ({ page }) => {
    await navigateTo(page, "dictation");
    await waitForPageReady(page);

    await page.getByText("中文→英文").click();
    await page.waitForTimeout(1000);

    const input = page.getByPlaceholder("输入英文单词...");
    await expect(input).toBeVisible({ timeout: 8000 });

    await input.fill("abandon");
    await page.getByRole("button", { name: "确认" }).click();
    await page.waitForTimeout(500);

    const feedback = page.getByText(/已匹配|正确|下一题|重试|跳过/);
    await expect(feedback.first()).toBeVisible({ timeout: 5000 });
  });

  test("听力→拼写模式默写", async ({ page }) => {
    await navigateTo(page, "dictation");
    await waitForPageReady(page);

    await page.getByText("听力→拼写").click();
    await page.waitForTimeout(1000);

    const input = page.getByPlaceholder("输入你听到的单词...");
    await expect(input).toBeVisible({ timeout: 8000 });

    await input.fill("test");
    await page.getByRole("button", { name: "确认" }).click();
    await page.waitForTimeout(500);

    const feedback = page.getByText(/已匹配|正确|下一题|重试|跳过/);
    await expect(feedback.first()).toBeVisible({ timeout: 5000 });
  });

  test("完成默写后显示结果", async ({ page }) => {
    await navigateTo(page, "dictation");
    await waitForPageReady(page);

    await page.getByText("中文→英文").click();
    await page.waitForTimeout(1000);

    const input = page.getByPlaceholder("输入英文单词...");
    await expect(input).toBeVisible({ timeout: 8000 });

    for (let i = 0; i < 10; i++) {
      await input.fill("abandon");
      await page.waitForTimeout(200);

      const confirmButton = page.getByRole("button", { name: "确认" });
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(800);

        const nextButton = page.getByRole("button", { name: "下一题" });
        const retryButton = page.getByRole("button", { name: "重试" });
        const resultButton = page.getByRole("button", { name: "查看结果" });

        if (await resultButton.isVisible().catch(() => false)) {
          await resultButton.click();
          break;
        }

        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(500);
        } else if (await retryButton.isVisible().catch(() => false)) {
          await input.fill("abandon");
          await confirmButton.click();
          await page.waitForTimeout(800);
        } else {
          break;
        }
      }
    }

    await expect(page.getByRole("heading", { name: "默写完成！" })).toBeVisible({ timeout: 15000 });
  });
});
