import { expect, test } from "@playwright/test";

import {
  expectNoAppError,
  expectPageUsable,
  loginWithFastApi,
  safeClickIfVisible,
} from "../utils/helpers";

test.describe("Full app smoke flow", () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await loginWithFastApi(page);
  });

  test.afterEach(async () => {
    expect(consoleErrors.filter((message) => !message.includes("favicon"))).toEqual([]);
  });

  test("logs in and checks core app functions", async ({ page }) => {
    await expectPageUsable(page, "/");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("nav").first()).toBeVisible();

    await page.goto("/words");
    await expectPageUsable(page, "/words");
    await page.getByPlaceholder(/failure|overcome|prevent/).fill("abandon");
    await expect(page.locator("a[href^='/words/']").first()).toBeVisible({ timeout: 15000 });
    await page.locator("a[href^='/words/']").first().click();
    await page.waitForURL(/\/words\/[^/]+$/);
    await expectNoAppError(page);
    await expect(page.locator("h1").first()).toBeVisible();
    await safeClickIfVisible(
      page
        .locator("button")
        .filter({ has: page.locator("svg") })
        .nth(1),
    );
    await safeClickIfVisible(page.getByRole("button").filter({ hasText: /掌握|认识|不认识/ }));

    await page.goto("/learn");
    await expectPageUsable(page, "/learn");
    await safeClickIfVisible(page.getByRole("button").filter({ hasText: /认识|掌握|不认识|跳过/ }));

    for (const route of ["/words/favorites", "/words/wrong"]) {
      await page.goto(route);
      await expectPageUsable(page, route);
    }

    for (const route of ["/reading", "/dictation", "/writing", "/profile", "/settings"]) {
      await page.goto(route);
      await expectPageUsable(page, route);
    }
  });
});
