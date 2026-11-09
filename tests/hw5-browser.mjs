// LectureFlow HW5: browser integration tests against a local HTTP server.
// Run: npm install --no-save playwright && npx playwright install chromium
// Then: python3 -m http.server 4173 --bind 127.0.0.1
// And: node tests/hw5-browser.mjs
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.HW5_BASE_URL || "http://127.0.0.1:4173/";
const outDir = "evidence/hw5_generated";
const results = [];
const browser = await chromium.launch({ headless: true });

async function check(name, fn) {
  await fn();
  results.push(name);
  console.log("PASS: " + name);
}
async function visibleTitles(page) {
  return await page.locator("#templates .card:visible h3").allTextContents();
}
try {
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push("JS: " + error.message));
  page.on("console", msg => {
    if (msg.type() === "error" && !msg.text().includes("favicon.ico")) pageErrors.push("Console: " + msg.text());
  });
  await page.goto(baseURL, { waitUntil: "load" });

  await check("Initial catalog contains seven cards", async () => {
    assert.equal((await visibleTitles(page)).length, 7);
    assert.match(await page.locator("#template-count").innerText(), /7 из 7/);
  });

  await check("Case-insensitive search with surrounding whitespace", async () => {
    await page.locator("#template-search").fill("  КОНСПЕКТ ");
    assert.deepEqual(await visibleTitles(page), ["Подробный конспект"]);
  });

  await check("Search and category are applied together", async () => {
    await page.selectOption("#template-category", "review");
    assert.equal((await visibleTitles(page)).length, 0);
    assert.equal(await page.locator("#templates-empty").isVisible(), true);
    await page.selectOption("#template-category", "notes");
    assert.deepEqual(await visibleTitles(page), ["Подробный конспект"]);
  });

  await check("Clearing search preserves chosen category", async () => {
    await page.locator("#template-search").fill("   ");
    assert.equal((await visibleTitles(page)).length, 2);
  });

  await check("Reset restores all cards and default selection", async () => {
    await page.locator("#reset-templates").click();
    assert.equal((await visibleTitles(page)).length, 7);
    assert.equal(await page.locator("#template-search").inputValue(), "");
    assert.equal(await page.locator("#template-category").inputValue(), "all");
  });

  await check("No-result state has explanatory text", async () => {
    await page.locator("#template-search").fill("неизвестный-шаблон-12345");
    assert.equal((await visibleTitles(page)).length, 0);
    assert.equal(await page.locator("#templates-empty").isVisible(), true);
    assert.match(await page.locator("#template-count").innerText(), /0 из 7/);
    await page.locator("#reset-templates").click();
  });

  await check("Details modal shows data from clicked card", async () => {
    await page.getByRole("button", { name: "Подробнее о шаблоне «Карточки Anki»" }).click();
    assert.equal(await page.locator("#template-details").evaluate(el => el.open), true);
    assert.equal(await page.locator("#template-details-title").innerText(), "Карточки Anki");
    assert.match(await page.locator("#template-details-text").innerText(), /Anki/);
  });

  await check("Modal closes on Escape, reopens for another card", async () => {
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#template-details").evaluate(el => el.open), false);
    await page.getByRole("button", { name: "Подробнее о шаблоне «Домашнее задание»" }).click();
    assert.equal(await page.locator("#template-details-title").innerText(), "Домашнее задание");
    await page.locator("#template-details-close").click();
    assert.equal(await page.locator("#template-details").evaluate(el => el.open), false);
  });

  await check("Select from modal preserves existing template selection", async () => {
    await page.getByRole("button", { name: "Подробнее о шаблоне «Краткое резюме»" }).click();
    await page.locator("#template-details-apply").click();
    assert.equal(await page.locator("#goal").inputValue(), "Краткое резюме");
    assert.equal(await page.locator(".card.selected").count(), 1);
    assert.equal(await page.locator("#template-details").evaluate(el => el.open), false);
  });

  await check("Old generator still produces prompt", async () => {
    await page.selectOption("#material", { label: "PDF" });
    await page.locator('#prompt-form button[type="submit"]').click();
    assert.match(await page.locator("#prompt-output").inputValue(), /Краткое резюме/);
    assert.equal(await page.locator("#copy-button").isDisabled(), false);
  });

  await check("Changing selected template resets stale prompt", async () => {
    await page.locator("#templates").scrollIntoViewIfNeeded();
    await page.locator("#templates .card").filter({ hasText: "Самопроверка" }).locator(".choose-template").click();
    assert.equal(await page.locator("#prompt-output").inputValue(), "");
    assert.equal(await page.locator("#copy-button").isDisabled(), true);
    assert.equal(await page.locator(".card.selected").count(), 1);
  });

  await check("Repeated filtering does not duplicate handlers", async () => {
    for (let i=0; i<7; i++) {
      await page.locator("#template-search").fill(i % 2 ? "" : "формулы");
      await page.selectOption("#template-category", i % 2 ? "all" : "analysis");
    }
    await page.locator("#reset-templates").click();
    await page.getByRole("button", { name: "Подробнее о шаблоне «Самопроверка»" }).click();
    assert.equal(await page.locator("#template-details-title").innerText(), "Самопроверка");
    await page.keyboard.press("Escape");
  });

  for (const width of [1440, 768, 390, 375, 320]) {
    await check("Responsive width " + width + "px: no horizontal overflow", async () => {
      const mobile = await browser.newPage({ viewport: { width, height: 840 }, isMobile: width <= 390, hasTouch: width <= 390 });
      const mobileErrors = [];
      mobile.on("pageerror", error => mobileErrors.push(error.message));
      await mobile.goto(baseURL, { waitUntil: "load" });
      const dims = await mobile.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert.ok(dims.scroll <= dims.client + 1, JSON.stringify(dims));
      assert.equal((await visibleTitles(mobile)).length, 7);
      await mobile.locator("#template-search").fill("Anki");
      assert.deepEqual(await visibleTitles(mobile), ["Карточки Anki"]);
      if (width === 1440 || width === 375) {
        await mobile.locator("#reset-templates").click();
        await mobile.screenshot({ path: outDir + "/hw5_" + width + ".png", fullPage: true });
      }
      assert.deepEqual(mobileErrors, []);
      await mobile.close();
    });
  }

  // Short real-browser screen recording to accompany the assignment.
  await check("Generate demonstration video", async () => {
    const demoContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: outDir, size: { width: 1280, height: 720 } }
    });
    const demo = await demoContext.newPage();
    await demo.goto(baseURL, { waitUntil: "load" });
    await demo.locator("#templates").scrollIntoViewIfNeeded();
    await demo.waitForTimeout(700);
    await demo.locator("#template-search").fill("конспект");
    await demo.waitForTimeout(800);
    await demo.selectOption("#template-category", "review");
    await demo.waitForTimeout(800);
    await demo.locator("#reset-templates").click();
    await demo.selectOption("#template-category", "analysis");
    await demo.waitForTimeout(700);
    await demo.getByRole("button", { name: "Подробнее о шаблоне «Домашнее задание»" }).click();
    await demo.waitForTimeout(1200);
    await demo.keyboard.press("Escape");
    await demo.getByRole("button", { name: "Подробнее о шаблоне «Формулы и алгоритмы»" }).click();
    await demo.waitForTimeout(800);
    await demo.locator("#template-details-apply").click();
    await demo.waitForTimeout(700);
    await demo.selectOption("#material", { label: "PDF" });
    await demo.locator('#prompt-form button[type="submit"]').click();
    await demo.waitForTimeout(1300);
    await demoContext.close();
    await demo.video().saveAs(outDir + "/hw5_demo.webm");
  });

  await check("No critical JavaScript/Console errors", async () => {
    assert.deepEqual(pageErrors, []);
  });
  const report = { status: "PASS", count: results.length, results, baseURL, mode: "Chromium / Playwright" };
  await writeFile(outDir + "/results.json", JSON.stringify(report, null, 2) + "\n");
  console.log("HW5 BROWSER QA: " + results.length + " PASS");
} catch (error) {
  const report = { status: "FAIL", count: results.length, results, error: String(error.stack || error), baseURL };
  await writeFile(outDir + "/results.json", JSON.stringify(report, null, 2) + "\n");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
