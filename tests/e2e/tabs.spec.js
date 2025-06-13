import { expect, test } from "@playwright/test";

test.describe("Pace Calculator - Tab Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app to load
    await expect(page.locator("#app")).toBeVisible();
  });

  test("should load with pace tab active by default @ui @basic", async ({
    page,
  }) => {
    // Check that pace tab is active
    await expect(page.locator('[data-tab="pace"]')).toHaveClass(/active/);

    // Check that pace section is visible
    await expect(page.locator('[data-section="pace"]')).toBeVisible();

    // Check that other sections are hidden
    await expect(page.locator('[data-section="time"]')).toHaveClass(/hidden/);
    await expect(page.locator('[data-section="distance"]')).toHaveClass(
      /hidden/
    );
  });

  test("should switch to time tab when clicked @ui @interaction", async ({
    page,
  }) => {
    // Click time tab
    await page.click('[data-tab="time"]');

    // Verify time tab is now active
    await expect(page.locator('[data-tab="time"]')).toHaveClass(/active/);
    await expect(page.locator('[data-tab="pace"]')).not.toHaveClass(/active/);

    // Verify sections visibility
    await expect(page.locator('[data-section="time"]')).toBeVisible();
    await expect(page.locator('[data-section="pace"]')).toHaveClass(/hidden/);
    await expect(page.locator('[data-section="distance"]')).toHaveClass(
      /hidden/
    );
  });

  test("should switch to distance tab when clicked @ui @interaction", async ({
    page,
  }) => {
    // Click distance tab
    await page.click('[data-tab="distance"]');

    // Verify distance tab is now active
    await expect(page.locator('[data-tab="distance"]')).toHaveClass(/active/);
    await expect(page.locator('[data-tab="pace"]')).not.toHaveClass(/active/);

    // Verify sections visibility
    await expect(page.locator('[data-section="distance"]')).toBeVisible();
    await expect(page.locator('[data-section="pace"]')).toHaveClass(/hidden/);
    await expect(page.locator('[data-section="time"]')).toHaveClass(/hidden/);
  });

  test("should preserve input values when switching tabs @functionality @persistence", async ({
    page,
  }) => {
    // Enter data in pace tab
    await page.fill("#pace-distance", "10");
    await page.fill("#pace-time-minutes", "45");

    // Switch to time tab
    await page.click('[data-tab="time"]');

    // Enter data in time tab
    await page.fill("#time-distance", "21.1");
    await page.fill("#time-pace-minutes", "4");

    // Switch back to pace tab
    await page.click('[data-tab="pace"]');

    // Verify pace tab values are preserved
    await expect(page.locator("#pace-distance")).toHaveValue("10");
    await expect(page.locator("#pace-time-minutes")).toHaveValue("45");

    // Switch back to time tab
    await page.click('[data-tab="time"]');

    // Verify time tab values are preserved
    await expect(page.locator("#time-distance")).toHaveValue("21.1");
    await expect(page.locator("#time-pace-minutes")).toHaveValue("4");
  });

  test("should handle rapid tab switching @functionality @stress", async ({
    page,
  }) => {
    // Rapidly switch between tabs
    await page.click('[data-tab="time"]');
    await page.click('[data-tab="distance"]');
    await page.click('[data-tab="pace"]');
    await page.click('[data-tab="time"]');
    await page.click('[data-tab="pace"]');

    // Should end up on pace tab
    await expect(page.locator('[data-tab="pace"]')).toHaveClass(/active/);
    await expect(page.locator('[data-section="pace"]')).toBeVisible();
  });

  test("should show correct form fields for each tab @ui @validation", async ({
    page,
  }) => {
    // Pace tab - should show time and distance inputs
    await expect(page.locator("#pace-time-hours")).toBeVisible();
    await expect(page.locator("#pace-time-minutes")).toBeVisible();
    await expect(page.locator("#pace-time-seconds")).toBeVisible();
    await expect(page.locator("#pace-distance")).toBeVisible();

    // Switch to time tab - should show pace and distance inputs
    await page.click('[data-tab="time"]');
    await expect(page.locator("#time-pace-minutes")).toBeVisible();
    await expect(page.locator("#time-pace-seconds")).toBeVisible();
    await expect(page.locator("#time-distance")).toBeVisible();

    // Switch to distance tab - should show time and pace inputs
    await page.click('[data-tab="distance"]');
    await expect(page.locator("#distance-time-hours")).toBeVisible();
    await expect(page.locator("#distance-time-minutes")).toBeVisible();
    await expect(page.locator("#distance-time-seconds")).toBeVisible();
    await expect(page.locator("#distance-pace-minutes")).toBeVisible();
    await expect(page.locator("#distance-pace-seconds")).toBeVisible();
  });

  test("should support keyboard navigation @accessibility @keyboard", async ({
    page,
  }) => {
    // Test natural tab order - should reach tabs via Tab key
    // Tab through elements until we reach the tab list
    await page.keyboard.press("Tab"); // Menu button
    await page.keyboard.press("Tab"); // Help button
    await page.keyboard.press("Tab"); // Should reach active tab (Pace)

    // Verify we can navigate tabs with arrow keys (proper ARIA pattern)
    await page.keyboard.press("ArrowRight"); // Move focus to Time tab
    await page.keyboard.press("Enter"); // Activate Time tab

    // Should switch to time tab
    await expect(page.locator('[data-tab="time"]')).toHaveClass(/active/);

    // Test Space key activation
    await page.keyboard.press("ArrowRight"); // Move focus to Distance tab
    await page.keyboard.press("Space"); // Activate with Space

    // Should switch to distance tab
    await expect(page.locator('[data-tab="distance"]')).toHaveClass(/active/);

    // Test backwards navigation
    await page.keyboard.press("ArrowLeft"); // Move focus back to Time tab
    await page.keyboard.press("Enter"); // Activate Time tab

    // Should switch back to time tab
    await expect(page.locator('[data-tab="time"]')).toHaveClass(/active/);
  });

  test("should have proper ARIA attributes @accessibility @aria", async ({
    page,
  }) => {
    // Check tab roles and attributes
    await expect(page.locator('[data-tab="pace"]')).toHaveAttribute(
      "role",
      "tab"
    );
    await expect(page.locator('[data-tab="time"]')).toHaveAttribute(
      "role",
      "tab"
    );
    await expect(page.locator('[data-tab="distance"]')).toHaveAttribute(
      "role",
      "tab"
    );

    // Check aria-selected attributes
    await expect(page.locator('[data-tab="pace"]')).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator('[data-tab="time"]')).toHaveAttribute(
      "aria-selected",
      "false"
    );

    // Switch tabs and check aria-selected changes
    await page.click('[data-tab="time"]');
    await expect(page.locator('[data-tab="time"]')).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator('[data-tab="pace"]')).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  test("should calculate pace correctly @functionality @calculation", async ({
    page,
  }) => {
    // Stay on pace tab and fill in values
    // await page.fill('#pace-time-minutes', '45');
    // await page.fill('#pace-time-seconds', '30');
    // await page.fill('#pace-distance', '10');
    // check default values
    await expect(page.getByRole("spinbutton", { name: "Minutes" })).toHaveValue(
      "45"
    );
    await expect(page.getByRole("spinbutton", { name: "Seconds" })).toHaveValue(
      "30"
    );
    // Fill in distance
    await page.getByRole("combobox", { name: "Distance" }).fill("10");

    // Click calculate
    await page.click('button[type="submit"]');

    // Wait for result to appear
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result-label")).toContainText("Your Pace:");

    // Should show a reasonable pace (around 4:33 /km for 45:30 over 10km)
    await expect(page.locator("#result-value")).toContainText("04:33");
  });

  test("should calculate time correctly @functionality @calculation", async ({
    page,
  }) => {
    // Switch to time tab
    await page.click('[data-tab="time"]');

    // Fill in pace and distance
    await page.fill("#time-pace-minutes", "5");
    await page.fill("#time-pace-seconds", "0");
    await page.fill("#time-distance", "10");

    // Click calculate
    await page.click('button[type="submit"]');

    // Wait for result to appear
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result-label")).toContainText("Your Time:");

    // Should show 50:00 for 5:00/km pace over 10km
    await expect(page.locator("#result-value")).toContainText("50:00");
  });

  test("should calculate distance correctly @functionality @calculation", async ({
    page,
  }) => {
    // Switch to distance tab
    await page.click('[data-tab="distance"]');

    // Fill in time and pace
    await page.fill("#distance-time-hours", "1");
    await page.fill("#distance-time-minutes", "0");
    await page.fill("#distance-time-seconds", "0");
    await page.fill("#distance-pace-minutes", "5");
    await page.fill("#distance-pace-seconds", "0");

    // Click calculate
    await page.click('button[type="submit"]');

    // Wait for result to appear
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result-label")).toContainText("Your Distance:");

    // Should show 12 km for 1 hour at 5:00/km pace
    await expect(page.locator("#result-value")).toContainText("12");
  });

  test("should clear form when clear button is clicked @functionality @ui", async ({
    page,
  }) => {
    // Fill in some values
    await page.fill("#pace-distance", "10");
    await page.fill("#pace-time-minutes", "45");

    // Click clear button
    await page.click("#clear-btn");

    // Values should be cleared
    await expect(page.locator("#pace-distance")).toHaveValue("");
    await expect(page.locator("#pace-time-minutes")).toHaveValue("");
  });

  test("should work on mobile viewport @responsive @mobile", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Should still be able to switch tabs
    await page.click('[data-tab="time"]');
    await expect(page.locator('[data-tab="time"]')).toHaveClass(/active/);

    // Form should still be functional
    await page.fill("#time-pace-minutes", "4");
    await page.fill("#time-distance", "5");
    await page.click('button[type="submit"]');

    // Result should appear
    await expect(page.locator("#result")).toBeVisible();
  });

  test("should handle preset distances @functionality @ui", async ({
    page,
  }) => {
    // Check that preset dropdown exists
    await expect(page.locator("#pace-preset")).toBeVisible();

    // Select a preset (5K)
    await page.selectOption("#pace-preset", { label: "5K (5 km)" });

    // Distance input should be filled
    await expect(page.locator("#pace-distance")).toHaveValue("5");
  });

  test("should maintain focus management @accessibility @focus", async ({
    page,
  }) => {
    // Tab navigation should work properly
    await page.keyboard.press("Tab");

    // Should be able to navigate through tabs with keyboard
    const focusedElement = await page.evaluate(
      () => document.activeElement.tagName
    );
    expect(["BUTTON", "INPUT", "SELECT"]).toContain(focusedElement);
  });
});
