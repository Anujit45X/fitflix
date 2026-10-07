import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const base = process.env.APP_ORIGIN || "http://localhost:5173";
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "msedge",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
fs.mkdirSync("../docs/screenshots/current", { recursive: true });
const email = `fitflix-e2e-${Date.now()}@example.invalid`,
  password = "Browser-test-passphrase-2026!";
try {
  await page.goto(base);
  await expect(
    page.getByRole("heading", { name: /Your everyday/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/current/landing-1440.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Get started" }).click();
  await page.getByLabel("Your name").fill("QA Test Account");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password · at least 12 characters").fill(password);
  await page.getByRole("button", { name: /^Create account/ }).click();
  await page.waitForURL("**/onboarding");
  await page
    .getByRole("button", { name: /Save profile & generate targets/ })
    .click();
  await page.waitForURL("**/today");
  await page.getByRole("button", { name: "+ Log a meal", exact: true }).click();
  await page
    .getByLabel("Search foods")
    .fill("Rice, white, long-grain, regular, enriched, cooked");
  await page
    .getByRole("button", {
      name: "Add Rice, white, long-grain, regular, enriched, cooked",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Grams for Rice, white, long-grain, regular, enriched, cooked")
    .fill("150");
  const mealResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/v1/meals") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  const meal = await (await mealResponse).json();
  expect(meal.items[0].calories).toBe(195);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Food", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit meal", exact: true }).click();
  await page
    .getByLabel("Grams for Rice, white, long-grain, regular, enriched, cooked")
    .fill("200");
  const editResponse = page.waitForResponse(
    (r) => r.url().includes("/api/v1/meals/") && r.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Update meal", exact: true }).click();
  expect((await (await editResponse).json()).items[0].calories).toBe(260);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Delete/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit meal", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Today", exact: true })
    .click();
  await page.getByRole("button", { name: "+ 250 ml", exact: true }).click();
  await page.getByRole("button", { name: "Undo last water entry" }).click();
  await expect(
    page.getByRole("button", { name: "Undo last water entry" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "+ 500 ml", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Progress", exact: true })
    .click();
  await page.getByLabel("Weight (kg)", { exact: true }).fill("69.4");
  await page.getByRole("button", { name: "Save weight", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Progress saved");
  await page
    .getByRole("navigation", { name: "More features" })
    .getByRole("link", { name: "Build my thali" })
    .click();
  await page
    .getByRole("button", { name: /Bengali-inspired rice, dal & shaak/ })
    .click();
  await expect(
    page.getByLabel(
      "Grams for Rice, white, long-grain, regular, enriched, cooked",
    ),
  ).toHaveValue("150");
  await page
    .getByRole("button", { name: "Save for later", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Thali saved");
  await page.getByRole("button", { name: "Log thali", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Thali added");
  await page
    .getByRole("navigation", { name: "More features" })
    .getByRole("link", { name: "Saved meals" })
    .click();
  await page.getByRole("button", { name: "Log today", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Added");
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Workouts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Schedule workout", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "More features" })
    .getByRole("link", { name: "Insights & trends" })
    .click();
  await expect(page.locator("main h1")).toBeVisible();
  const layouts = [];
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/today",
      "/diary",
      "/thali",
      "/workouts",
      "/progress",
      "/profile",
      "/planner",
      "/settings",
      "/analytics",
    ]) {
      await page.evaluate((path) => {
        history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, route);
      await expect(page.locator("main h1")).toBeVisible();
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      expect(overflow, `horizontal overflow on ${route} at ${width}px`).toBe(
        false,
      );
      layouts.push({ route, width, overflow });
      if (["/today", "/thali", "/workouts"].includes(route))
        await page.screenshot({
          path: `../docs/screenshots/current/${route.slice(1)}-${width}.png`,
          fullPage: true,
        });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Today", exact: true })
    .click();
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "+ Log a meal", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await page.waitForURL("**/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const persisted = page.waitForResponse(
    (r) => r.url().includes("/api/v1/dashboard?") && r.status() === 200,
  );
  await page.getByRole("button", { name: /^Sign in/ }).click();
  await page.waitForURL("**/today");
  const persistedData = await (await persisted).json();
  expect(persistedData.totals.water).toBe(500);
  expect(persistedData.weight).toBe(69.4);
  expect(persistedData.meals).toHaveLength(2);
  await expect(
    page.getByRole("heading", { name: "A moment to hydrate" }),
  ).toBeVisible();
  await context.storageState({ path: "../.local/browser-state.json" });
  fs.writeFileSync(
    "../.local/test-account.json",
    JSON.stringify({ email, password }),
  );
  expect(errors).toEqual([]);
  fs.writeFileSync(
    "../docs/browser-results.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        journeys: [
          "register",
          "onboard",
          "meal-create",
          "portion-edit",
          "meal-delete",
          "water-add-undo",
          "weight",
          "thali-save-log",
          "saved-repeat",
          "workout-complete",
          "refresh",
          "progress",
          "logout-login",
          "dialog-escape",
        ],
        layouts,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: daily journey; ${layouts.length} responsive route checks; ${errors.length} page errors.`,
  );
} catch (e) {
  await page.screenshot({
    path: "../.local/browser-failure.png",
    fullPage: true,
  });
  throw e;
} finally {
  await browser.close();
}
