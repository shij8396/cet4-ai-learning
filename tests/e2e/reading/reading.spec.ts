import { test, expect } from "@playwright/test";

import { loginAs, expectToast, navigateTo } from "../utils/helpers";

test.describe("Reading", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "e2e-test@cet4.com", "E2eTest123!");
    await expectToast(page, "登录成功");
  });

  test("文章加载", async ({ page }) => {
    await navigateTo(page, "reading");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("阅读训练")).toBeVisible({ timeout: 10000 });

    const articleLinks = page.locator("a[href*='/reading/']");
    const count = await articleLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("阅读等级切换", async ({ page }) => {
    await navigateTo(page, "reading");
    await page.waitForLoadState("networkidle");

    const beginnerBtn = page.getByRole("button", { name: "入门" });
    if (await beginnerBtn.isVisible().catch(() => false)) {
      await beginnerBtn.click();
      await page.waitForTimeout(500);

      const content = page.locator("a[href*='/reading/']");
      await expect(content.first()).toBeVisible({ timeout: 5000 });
    }

    const intermediateBtn = page.getByRole("button", { name: "中级" });
    if (await intermediateBtn.isVisible().catch(() => false)) {
      await intermediateBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test("点击进入文章详情", async ({ page }) => {
    await navigateTo(page, "reading");
    await page.waitForLoadState("networkidle");

    const firstArticle = page.locator("a[href*='/reading/']").first();
    await expect(firstArticle).toBeVisible({ timeout: 10000 });

    const href = await firstArticle.getAttribute("href");
    await firstArticle.click();
    await page.waitForURL(`**${href}`, { timeout: 10000 });

    const title = page.locator("h1").first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });

  test("阅读进度", async ({ page }) => {
    await navigateTo(page, "reading");
    await page.waitForLoadState("networkidle");

    const firstArticle = page.locator("a[href*='/reading/']").first();
    await firstArticle.click();
    await page.waitForTimeout(1000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    await page.goBack();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/reading/);

    await expect(page.getByText("阅读训练")).toBeVisible({ timeout: 5000 });
  });

  test("生词加入", async ({ page }) => {
    await navigateTo(page, "reading");
    await page.waitForLoadState("networkidle");

    const firstArticle = page.locator("a[href*='/reading/']").first();
    await firstArticle.click();
    await page.waitForTimeout(2000);

    const wordSpans = page.locator("[data-word]");
    const wordCount = await wordSpans.count();
    if (wordCount > 0) {
      await wordSpans.first().click();
      await page.waitForTimeout(800);

      const vocabButton = page.getByRole("button", { name: /生词|添加/ });
      if (
        await vocabButton
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await vocabButton.first().click({ force: true });
        await page.waitForTimeout(300);
      }
    }
  });
});
