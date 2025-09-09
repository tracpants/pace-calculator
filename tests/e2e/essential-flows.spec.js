import { expect, test } from "@playwright/test";

test.describe("Essential User Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#app")).toBeVisible();
  });

  test("calculates pace correctly", async ({ page }) => {
    // Default values should be present
    await expect(page.getByRole("spinbutton", { name: "Minutes" })).toHaveValue("45");
    await expect(page.getByRole("spinbutton", { name: "Seconds" })).toHaveValue("30");
    
    // Fill distance
    await page.getByRole("combobox", { name: "Distance" }).fill("10");
    
    // Calculate
    await page.click('button[type="submit"]');
    
    // Verify result
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result-value")).toContainText("04:33");
  });

  test("calculates time correctly", async ({ page }) => {
    // Switch to time tab
    await page.click('[data-tab="time"]');
    
    // Fill inputs
    await page.fill("#time-pace-minutes", "5");
    await page.fill("#time-pace-seconds", "0");
    await page.fill("#time-distance", "10");
    
    // Calculate
    await page.click('button[type="submit"]');
    
    // Verify result
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result-value")).toContainText("50:00");
  });

  test("calculates distance correctly", async ({ page }) => {
    // Switch to distance tab
    await page.click('[data-tab="distance"]');
    
    // Fill inputs
    await page.fill("#distance-time-hours", "1");
    await page.fill("#distance-pace-minutes", "5");
    
    // Calculate
    await page.click('button[type="submit"]');
    
    // Verify result
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result-value")).toContainText("12");
  });

  test("preserves form state when switching tabs", async ({ page }) => {
    // Fill pace tab
    await page.fill("#pace-distance", "10");
    await page.fill("#pace-time-minutes", "45");
    
    // Switch to time tab
    await page.click('[data-tab="time"]');
    await page.fill("#time-distance", "21.1");
    
    // Switch back to pace tab
    await page.click('[data-tab="pace"]');
    
    // Verify values preserved
    await expect(page.locator("#pace-distance")).toHaveValue("10");
    await expect(page.locator("#pace-time-minutes")).toHaveValue("45");
  });

  test("uses preset distances", async ({ page }) => {
    // Select 5K preset
    await page.selectOption("#pace-preset", { label: /5K/i });
    
    // Distance should be filled
    await expect(page.locator("#pace-distance")).toHaveValue("5");
  });

  test("clears form", async ({ page }) => {
    // Fill some values
    await page.fill("#pace-distance", "10");
    await page.fill("#pace-time-minutes", "45");
    
    // Clear
    await page.click("#clear-btn");
    
    // Values should be cleared
    await expect(page.locator("#pace-distance")).toHaveValue("");
    await expect(page.locator("#pace-time-minutes")).toHaveValue("");
  });

  test("works on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Basic functionality should still work
    await page.click('[data-tab="time"]');
    await expect(page.locator('[data-tab="time"]')).toHaveClass(/active/);
    
    // Can fill and calculate
    await page.fill("#time-pace-minutes", "4");
    await page.fill("#time-distance", "5");
    await page.click('button[type="submit"]');
    
    await expect(page.locator("#result")).toBeVisible();
  });
});