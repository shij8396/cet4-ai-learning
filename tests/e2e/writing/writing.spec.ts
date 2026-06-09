import { test, expect } from "@playwright/test";

import { waitForPageReady, loginAs, expectToast } from "../utils/helpers";

test.describe("作文功能测试", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectToast(page, "登录成功");
  });

  test("页面加载并显示写作区域", async ({ page }) => {
    await page.goto("/writing");
    await waitForPageReady(page);

    await expect(page.getByText("作文助手")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("作文标题（可选）")).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder(/开始写作文/)).toBeVisible({ timeout: 5000 });
  });

  test("文本输入", async ({ page }) => {
    await page.goto("/writing");
    await waitForPageReady(page);

    const textarea = page.getByPlaceholder(/开始写作文/);
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const longText = "I love learning English because it is very important for my future career.";
    await textarea.fill(longText);
    await page.waitForTimeout(500);

    await expect(textarea).toHaveValue(longText);
  });

  test("自动保存提示", async ({ page }) => {
    await page.goto("/writing");
    await waitForPageReady(page);

    const textarea = page.getByPlaceholder(/开始写作文/);
    await textarea.fill("I am writing a test composition.");
    await page.waitForTimeout(4000);

    const autoSave = page.getByText(/自动保存于|正在输入/);
    await expect(autoSave.first()).toBeVisible({ timeout: 10000 });
  });

  test("历史记录按钮", async ({ page }) => {
    await page.goto("/writing");
    await waitForPageReady(page);

    const historyButton = page.getByRole("button", { name: "历史", exact: true });
    await expect(historyButton).toBeVisible({ timeout: 5000 });
    await historyButton.click();
    await page.waitForTimeout(500);

    await expect(page.getByText("作文历史")).toBeVisible({ timeout: 5000 });
  });

  test("表达助手功能可用", async ({ page }) => {
    await page.goto("/writing");
    await waitForPageReady(page);

    const assistantButton = page.getByRole("button", { name: "表达助手" }).first();
    await expect(assistantButton).toBeVisible({ timeout: 5000 });

    await assistantButton.click();
    await page.waitForTimeout(500);

    const assistantText = page.getByText(/中文想法|建议|示例/i);
    await expect(assistantText.first()).toBeVisible({ timeout: 5000 });
  });
});
