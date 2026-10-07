import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:5173/");
await page.waitForURL("**/login");
await page.getByRole("link", { name: "Create an account" }).click();
await page.getByLabel("Your name").fill("Browser Tester");
await page
  .getByLabel("Email address")
  .fill(`browser-${Date.now()}@example.com`);
await page
  .getByLabel("Password · at least 12 characters")
  .fill("Browser-test-password!");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/onboarding");
await page
  .getByRole("button", { name: "Save profile & generate targets" })
  .click();
await page.waitForURL("http://localhost:5173/");
await page.reload();
await page.getByText("YOUR HEALTH, IN FOCUS").waitFor();
await page.getByRole("button", { name: "+ Log food", exact: true }).click();
await page.getByLabel("Search foods").fill("rice");
await page.getByRole("button", { name: "Search", exact: true }).click();
await page
  .getByRole("button", { name: /^Add .*rice/i })
  .first()
  .click();
await page.getByRole("button", { name: "Log meal", exact: true }).click();
await page.getByRole("dialog").waitFor({ state: "hidden" });
await page.getByRole("button", { name: "+ 250 ml", exact: true }).click();
await page.getByText("0.25", { exact: false }).first().waitFor();
await page.getByRole("link", { name: "Food diary", exact: true }).click();
await page
  .getByRole("button", { name: "Edit meal", exact: true })
  .first()
  .waitFor();
await page.reload();
await page
  .getByRole("button", { name: "Edit meal", exact: true })
  .first()
  .waitFor();
await page.getByRole("link", { name: "Overview", exact: true }).click();
fs.mkdirSync("../docs/screenshots", { recursive: true });
await page.screenshot({
  path: "../docs/screenshots/new-account.png",
  fullPage: true,
});
await page.getByRole("button", { name: "Sign out", exact: true }).click();
await page.waitForURL("**/login");
await page.getByLabel("Email address").fill("demo@fitplix.local");
await page
  .getByLabel("Password", { exact: true })
  .fill(process.env.DEMO_PASSWORD);
await page.getByRole("button", { name: /^Sign in/ }).click();
await page.waitForURL("http://localhost:5173/");
await page.getByText("Looking good, Alex", { exact: false }).waitFor();
await page.screenshot({
  path: "../docs/screenshots/dashboard.png",
  fullPage: true,
});
await page.getByRole("link", { name: "Analytics", exact: true }).click();
await page.getByText("Your patterns, explained.").waitFor();
await page.getByLabel("Analytics range").selectOption("7");
await page.getByText("7 of 7 days logged", { exact: false }).waitFor();
await page.screenshot({
  path: "../docs/screenshots/analytics.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("link", { name: "Overview", exact: true }).click();
await page.getByText("Looking good, Alex", { exact: false }).waitFor();
await page.screenshot({
  path: "../docs/screenshots/mobile.png",
  fullPage: true,
});
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
);
if (overflow) throw new Error("Mobile page overflows");
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole("button", { name: "Sign out", exact: true }).click();
await page.waitForURL("**/login");
await page.getByLabel("Email address").fill("admin@fitplix.local");
await page
  .getByLabel("Password", { exact: true })
  .fill(process.env.DEMO_PASSWORD);
await page.getByRole("button", { name: /^Sign in/ }).click();
await page.waitForURL("http://localhost:5173/");
await page
  .getByRole("link", { name: "Product analytics", exact: true })
  .click();
await page.getByText("Feature adoption", { exact: true }).waitFor();
await page.screenshot({
  path: "../docs/screenshots/product.png",
  fullPage: true,
});
await page.getByRole("tab", { name: "Retention", exact: true }).click();
await page.getByText("Registration cohorts").waitFor();
await page.screenshot({
  path: "../docs/screenshots/cohorts.png",
  fullPage: true,
});
await page.getByRole("tab", { name: "Funnel", exact: true }).click();
await page.getByText("The activation journey").waitFor();
await page.getByRole("tab", { name: "Experiments", exact: true }).click();
await page.getByText("Standard dashboard", { exact: true }).waitFor();
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  "PASS browser: protected routes, registration, onboarding, refresh, meal/hydration logging, diary persistence, analytics filters, mobile layout, admin KPIs/cohorts/funnel/experiments and logout.",
);
await browser.close();
