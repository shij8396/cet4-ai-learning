from playwright.sync_api import sync_playwright
import os

SCREENSHOTS_DIR = "public/demo-screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
    )
    page = context.new_page()

    print("=" * 60)
    print("   🏥 CET4 AI 英语学习系统 — 自动演示")
    print("=" * 60)

    # Step 1: Login
    print("\n📌 [1/8] 打开登录页面...")
    page.goto("http://localhost:3000/login", wait_until="networkidle")
    page.screenshot(path=f"{SCREENSHOTS_DIR}/01-login-page.png", full_page=True)
    print("   ✅ 登录页面截图已保存")

    print("\n📌 [2/8] 填写登录信息...")
    page.fill("#email", "test@cet4.com")
    page.fill("#password", "test123456")
    page.screenshot(path=f"{SCREENSHOTS_DIR}/02-login-filled.png", full_page=True)
    print("   ✅ 表单填写截图已保存")

    print("\n📌 [3/8] 点击登录按钮...")
    page.click("button:has-text('登录')")
    page.wait_for_timeout(3000)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"{SCREENSHOTS_DIR}/03-home-after-login.png", full_page=True)
    print("   ✅ 登录成功，首页截图已保存")

    # Step 2: Reading
    print("\n📌 [4/8] 打开阅读训练页面...")
    page.goto("http://localhost:3000/reading", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/04-reading.png", full_page=True)
    print("   ✅ 阅读训练截图已保存")

    # Step 3: Dictation
    print("\n📌 [5/8] 打开单词默写页面...")
    page.goto("http://localhost:3000/dictation", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/05-dictation.png", full_page=True)
    print("   ✅ 单词默写截图已保存")

    # Step 4: Writing
    print("\n📌 [6/8] 打开作文助手页面...")
    page.goto("http://localhost:3000/writing", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/06-writing.png", full_page=True)
    print("   ✅ 作文助手截图已保存")

    # Step 5: Words
    print("\n📌 [7/8] 打开四级词库页面...")
    page.goto("http://localhost:3000/words", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/07-words.png", full_page=True)
    print("   ✅ 四级词库截图已保存")

    # Step 6: Profile / Settings
    print("\n📌 [8/8] 打开设置页面...")
    page.goto("http://localhost:3000/settings", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/08-settings.png", full_page=True)
    print("   ✅ 设置页面截图已保存")

    print("\n" + "=" * 60)
    print("   🎉 系统演示完成！所有截图已保存到 public/demo-screenshots/")
    print("=" * 60)

    context.close()
    browser.close()