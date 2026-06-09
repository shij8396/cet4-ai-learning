import { test, expect } from "@playwright/test";

import { navigateTo, waitForPageReady, loginAs, expectToast } from "../utils/helpers";

test.describe("词汇/生词本测试", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectToast(page, "登录成功");
  });

  test.describe("单词列表页 /words", () => {
    test("页面加载后显示单词列表", async ({ page }) => {
      await navigateTo(page, "words");
      await waitForPageReady(page);

      await expect(page.getByRole("heading", { name: "四级词库" })).toBeVisible({ timeout: 10000 });

      const hasContent =
        (await page
          .getByText("暂无单词数据")
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator("a[href*='/words/']")
          .first()
          .isVisible()
          .catch(() => false));
      expect(hasContent).toBe(true);
    });

    test("搜索框可见且可输入", async ({ page }) => {
      await navigateTo(page, "words");
      await waitForPageReady(page);

      const searchInput = page.getByPlaceholder("搜索单词...");
      await expect(searchInput).toBeVisible({ timeout: 10000 });
      await searchInput.fill("abandon");
      await page.waitForTimeout(500);
      await expect(searchInput).toHaveValue("abandon");
    });

    test("收藏和错词本导航按钮存在", async ({ page }) => {
      await navigateTo(page, "words");
      await waitForPageReady(page);

      await expect(page.getByRole("button", { name: "收藏" })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("button", { name: "错词本" })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("错词页面 /words/wrong", () => {
    test("错词本页面加载正常", async ({ page }) => {
      await navigateTo(page, "wrong");
      await waitForPageReady(page);

      await expect(page.getByRole("heading", { name: "错词本" })).toBeVisible({ timeout: 10000 });

      const hasStatus =
        (await page
          .getByText(/暂无错词/)
          .isVisible()
          .catch(() => false)) ||
        (await page
          .getByText(/共.*个需要复习的单词/)
          .isVisible()
          .catch(() => false));
      expect(hasStatus).toBe(true);
    });
  });

  test.describe("生词本 /words/favorites", () => {
    test("收藏页面加载正常", async ({ page }) => {
      await navigateTo(page, "favorites");
      await waitForPageReady(page);

      await expect(page.getByRole("heading", { name: "我的收藏" })).toBeVisible({
        timeout: 10000,
      });

      const hasStatus =
        (await page
          .getByText(/暂无收藏/)
          .isVisible()
          .catch(() => false)) ||
        (await page
          .getByText("我的收藏")
          .isVisible()
          .catch(() => false));
      expect(hasStatus).toBe(true);
    });
  });
});
