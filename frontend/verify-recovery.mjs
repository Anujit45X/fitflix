import { chromium } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    (process.env.APP_ORIGIN || "http://localhost:5173") + "/login",
  );
  await page.getByRole("link", { name: "Password recovery" }).click();
  await page.getByRole("heading", { name: "Let’s get you back in." }).waitFor();
  await page.getByLabel("Email address").fill(process.env.RECOVERY_EMAIL);
  const sent = page.waitForResponse((r) =>
    r.url().endsWith("/auth/forgot-password"),
  );
  await page.getByRole("button", { name: "Send reset link" }).click();
  const response = await sent;
  if (response.status() !== 200)
    throw Error("Recovery request status " + response.status());
  await page.getByRole("status").waitFor();
  for (let i = 0; i < 100 && !existsSync(process.env.RECOVERY_MAILBOX); i++)
    await new Promise((r) => setTimeout(r, 100));
  const { url } = JSON.parse(readFileSync(process.env.RECOVERY_MAILBOX));
  await page.goto(url);
  if (page.url().includes("#")) throw Error("Token remained in URL");
  await page
    .getByLabel("New password", { exact: true })
    .fill(process.env.RECOVERY_PASSWORD);
  await page.getByLabel("Confirm password").fill("Different-password");
  await page.getByRole("button", { name: "Update password" }).click();
  await page.getByText("Passwords do not match").waitFor();
  await page.getByLabel("Confirm password").fill(process.env.RECOVERY_PASSWORD);
  await page.getByRole("button", { name: "Update password" }).click();
  await page
    .getByText("Password updated. Sign in with your new password.")
    .waitFor();
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await page.getByRole("heading", { name: "Good to have you back." }).waitFor();
  await page.getByLabel("Email address").fill(process.env.RECOVERY_EMAIL);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.RECOVERY_PASSWORD);
  await page.getByRole("button", { name: /Sign in/ }).click();
  await page.waitForURL("**/onboarding");
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS recovery browser: request, mail link, URL cleanup, mismatch validation, reset, new login",
  );
} finally {
  await browser.close();
}
