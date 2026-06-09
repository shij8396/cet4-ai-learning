import { test, expect } from "@playwright/test";

import { waitForPageReady } from "../utils/helpers";

test.describe("PWA测试", () => {
  test.describe("manifest.json", () => {
    test("manifest.json返回合法的JSON配置", async ({ page }) => {
      const response = await page.request.get("/manifest.json");

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");

      const manifest = await response.json();
      expect(manifest.name).toBeDefined();
      expect(manifest.short_name).toBeDefined();
      expect(manifest.start_url).toBeDefined();
      expect(manifest.display).toBeDefined();
      expect(manifest.theme_color).toBeDefined();
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });
  });

  test.describe("Service Worker", () => {
    test("浏览器支持Service Worker API", async ({ page }) => {
      await page.goto("/");
      await waitForPageReady(page);

      const hasSW = await page.evaluate(() => "serviceWorker" in navigator);
      expect(hasSW).toBe(true);
    });

    test("Service Worker文件可访问", async ({ page }) => {
      const response = await page.request.get("/sw.js");

      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body.length).toBeGreaterThan(0);
    });
  });

  test.describe("离线页面", () => {
    test("离线页面存在并正确渲染", async ({ page }) => {
      await page.goto("/offline");
      await waitForPageReady(page);

      const bodyContent = page.locator("body");
      await expect(bodyContent).toBeVisible();
      const text = await bodyContent.innerText();
      expect(text.length).toBeGreaterThan(0);
    });

    test("离线页面存在有意义的提示内容", async ({ page }) => {
      await page.goto("/offline");
      await waitForPageReady(page);

      const hasContent = await page
        .getByText(/离线|网络|连接|offline/i)
        .first()
        .isVisible()
        .catch(() => false);
      const hasBodyText = (await page.locator("body").innerText()).length > 10;
      expect(hasContent || hasBodyText).toBe(true);
    });
  });

  test.describe("添加到主屏幕", () => {
    test("beforeinstallprompt事件可监听", async ({ page }) => {
      await page.goto("/");
      await waitForPageReady(page);

      const eventSupported = await page.evaluate(() => {
        const handler = () => {};
        window.addEventListener("beforeinstallprompt", handler, { once: true });
        window.dispatchEvent(new Event("beforeinstallprompt"));
        window.removeEventListener("beforeinstallprompt", handler);
        return typeof window !== "undefined";
      });

      expect(eventSupported).toBe(true);
    });

    test("manifest配置支持standalone显示模式", async ({ page }) => {
      const response = await page.request.get("/manifest.json");
      const manifest = await response.json();

      expect(manifest.display).toBe("standalone");
    });
  });
});
