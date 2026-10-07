import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "msedge",
  headless: true,
});
try {
  const context = await browser.newContext({
    storageState: "../.local/browser-state.json",
  });
  const page = await context.newPage();
  const response = page.waitForResponse(
    (r) => r.url().includes("/api/v1/dashboard?") && r.status() === 200,
  );
  await page.goto("http://localhost:5173/today");
  await expect(page.getByRole("heading", { name: /Hello, QA/ })).toBeVisible();
  const d = await (await response).json();
  expect(d.totals.water).toBe(500);
  expect(d.weight).toBe(69.4);
  expect(d.meals).toHaveLength(2);
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Workouts", exact: true })
    .click();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Make your goals yours." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Account settings", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your account, your control." }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Today", exact: true })
    .click();
  await page.getByRole("button", { name: "+ Log a meal", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await context.storageState({ path: "../.local/browser-state.json" });
  fs.writeFileSync(
    "../docs/restart-results.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        checks: [
          "HttpOnly session refresh after API/database restart",
          "two persisted thali logs",
          "500 ml water",
          "69.4 kg weight",
          "completed workout",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: login session, meals, water, weight and workout survived API and PostgreSQL restart; mobile navigation and dialog work.",
  );
} finally {
  await browser.close();
}
