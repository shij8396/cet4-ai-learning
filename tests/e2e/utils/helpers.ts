import { type Page, expect } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();
}

export async function registerAs(
  page: Page,
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
) {
  await page.goto("/register");
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(confirmPassword);
  await page.getByRole("button", { name: "注册" }).click();
}

export async function expectToast(page: Page, text: string) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 10000 });
}

export async function expectUrl(page: Page, path: string) {
  await page.waitForURL(`**${path}`, { timeout: 10000 });
}

export async function navigateTo(page: Page, section: string) {
  const navMap: Record<string, string> = {
    home: "/",
    reading: "/reading",
    dictation: "/dictation",
    writing: "/writing",
    words: "/words",
    favorites: "/words/favorites",
    wrong: "/words/wrong",
    achievements: "/achievements",
    analytics: "/analytics",
    profile: "/profile",
    settings: "/settings",
  };

  const url = navMap[section];
  if (!url) throw new Error(`Unknown section: ${section}`);
  await page.goto(url);
}

export async function waitForPageReady(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

export async function fillFormField(page: Page, label: string, value: string) {
  const field =
    page.getByLabel(label) || page.getByPlaceholder(label) || page.locator(`[name="${label}"]`);
  await field.fill(value);
}

export async function measurePageLoad(page: Page, url: string): Promise<number> {
  const start = Date.now();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  return Date.now() - start;
}

export async function measureAIResponseTime(
  page: Page,
  action: () => Promise<void>,
): Promise<number> {
  const start = Date.now();
  await action();
  return Date.now() - start;
}

export async function checkMobileResponsive(page: Page) {
  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThanOrEqual(430);
  expect(viewport?.height).toBeLessThanOrEqual(932);

  const body = page.locator("body");
  const overflowX = await body.evaluate((el) => getComputedStyle(el).overflowX);
  expect(overflowX).not.toBe("scroll");
}

export async function checkSafeArea(page: Page) {
  const html = page.locator("html");
  const paddingBottom = await html.evaluate((el) =>
    getComputedStyle(el).getPropertyValue("padding-bottom"),
  );
  const envSafe = await html.evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--safe-area-inset-bottom"),
  );
  return { paddingBottom, envSafe };
}

export async function checkKeyboardNotObscuring(page: Page, inputSelector: string) {
  const input = page.locator(inputSelector);
  await input.focus();
  const isVisible = await input.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight * 0.6;
  });
  return isVisible;
}

export async function checkScrollBehavior(page: Page) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(0);
  expect(scrollHeight).toBeGreaterThan(window.innerHeight);
}

export function generateUniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@cet4.com`;
}
