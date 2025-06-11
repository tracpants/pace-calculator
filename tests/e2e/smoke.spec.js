import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Application Health', () => {
  
  test('application loads without errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Listen for page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the main app container to be visible
    await expect(page.locator('#app')).toBeVisible();
    
    // Check that no console errors occurred during load
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
  
  test('essential UI elements are present', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await expect(page.locator('#app')).toBeVisible();
    
    // Check for essential UI elements
    await expect(page.locator('[data-tab="pace"]')).toBeVisible();
    await expect(page.locator('[data-tab="time"]')).toBeVisible(); 
    await expect(page.locator('[data-tab="distance"]')).toBeVisible();
    
    // Check for calculator form
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
  
  test('no broken imports or missing resources', async ({ page }) => {
    // Track failed requests
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText
      });
    });
    
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
    
    // Give time for all resources to load
    await page.waitForTimeout(2000);
    
    // Check that no requests failed (which would indicate broken imports)
    expect(failedRequests).toEqual([]);
  });
  
  test('basic calculator functionality works', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
    
    // Fill in pace calculation form (should be the default tab)
    await page.fill('#pace-time-minutes', '4');
    await page.fill('#pace-time-seconds', '30');
    await page.fill('#pace-distance', '5');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check that a result appears (basic functionality test)
    await expect(page.locator('#result')).toBeVisible();
  });
});