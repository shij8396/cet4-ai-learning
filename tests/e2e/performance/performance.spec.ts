import { test, expect } from "@playwright/test";

import { TEST_USER } from "../fixtures/test-data";
import { measurePageLoad, loginAs, waitForPageReady } from "../utils/helpers";

test.describe("性能测试", () => {
  test("首页加载时间小于10秒", async ({ page }) => {
    const loadTime = await measurePageLoad(page, "/");
    await waitForPageReady(page);
    expect(loadTime).toBeLessThan(10000);
  });

  test("登录页加载时间小于8秒", async ({ page }) => {
    const loadTime = await measurePageLoad(page, "/login");
    await waitForPageReady(page);
    expect(loadTime).toBeLessThan(8000);
  });

  test("内存使用在合理范围内", async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
    await page.waitForURL("**/", { timeout: 10000 });
    await waitForPageReady(page);

    const metrics = await page.evaluate(async () => {
      type MemoryPerformance = Performance & {
        measureUserAgentSpecificMemory?: () => Promise<{
          bytes: number;
          breakdown: unknown[];
        }>;
      };

      const memoryPerformance = performance as MemoryPerformance;
      if (memoryPerformance.measureUserAgentSpecificMemory) {
        const result = await memoryPerformance.measureUserAgentSpecificMemory();
        return {
          bytes: result.bytes,
          breakdown: result.breakdown,
          supported: true,
        };
      }
      return { supported: false, bytes: 0, breakdown: [] };
    });

    if (metrics.supported) {
      const megabytes = metrics.bytes / (1024 * 1024);
      expect(megabytes).toBeLessThan(100);
    }
  });

  test("导航到/reading页面在3秒内", async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
    await page.waitForURL("**/", { timeout: 10000 });
    await waitForPageReady(page);

    await page.goto("/reading", { waitUntil: "domcontentloaded" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    const start = Date.now();
    await page.goto("/reading", { waitUntil: "domcontentloaded" });
    const navTime = Date.now() - start;

    expect(navTime).toBeLessThan(3000);
  });
});
