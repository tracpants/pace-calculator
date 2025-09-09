import { test, expect } from '@playwright/test';

test.describe('Modal Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
  });

  test.describe('Menu Dropdown', () => {
    test('opens and closes menu dropdown', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const menuDropdown = page.locator('#menu-dropdown');

      // Initially hidden
      await expect(menuDropdown).toHaveClass(/hidden/);

      // Click to open
      await menuBtn.click();
      await expect(menuDropdown).not.toHaveClass(/hidden/);

      // Click outside to close
      await page.locator('#app').click();
      await expect(menuDropdown).toHaveClass(/hidden/);
    });
  });

  test.describe('Settings Modal', () => {
    test('opens settings modal from menu', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const settingsMenuItem = page.locator('#settings-menu-item');
      const settingsModal = page.locator('#settings-modal');

      // Open menu
      await menuBtn.click();
      
      // Click settings menu item
      await settingsMenuItem.click();
      
      // Modal should be visible
      await expect(settingsModal).not.toHaveClass(/hidden/);
      await expect(settingsModal).toBeVisible();
    });

    test('closes settings modal with close button', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const settingsMenuItem = page.locator('#settings-menu-item');
      const settingsModal = page.locator('#settings-modal');
      const closeBtn = page.locator('#close-settings');

      // Open settings modal
      await menuBtn.click();
      await settingsMenuItem.click();
      await expect(settingsModal).toBeVisible();

      // Close with button
      await closeBtn.click();
      await expect(settingsModal).toHaveClass(/hidden/);
    });

    test('closes settings modal with backdrop click', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const settingsMenuItem = page.locator('#settings-menu-item');
      const settingsModal = page.locator('#settings-modal');

      // Open settings modal
      await menuBtn.click();
      await settingsMenuItem.click();
      await expect(settingsModal).toBeVisible();

      // Click backdrop to close
      await settingsModal.click();
      await expect(settingsModal).toHaveClass(/hidden/);
    });

    test('closes settings modal with Escape key', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const settingsMenuItem = page.locator('#settings-menu-item');
      const settingsModal = page.locator('#settings-modal');

      // Open settings modal
      await menuBtn.click();
      await settingsMenuItem.click();
      await expect(settingsModal).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');
      await expect(settingsModal).toHaveClass(/hidden/);
    });
  });

  test.describe('PR Management Modal', () => {
    test('opens PR management modal from menu', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const prMenuItem = page.locator('#pr-menu-item');
      const prModal = page.locator('#pr-management-modal');

      // Open menu
      await menuBtn.click();
      
      // Click PR menu item
      await prMenuItem.click();
      
      // Modal should be visible
      await expect(prModal).not.toHaveClass(/hidden/);
      await expect(prModal).toBeVisible();
    });

    test('closes PR management modal with close button', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const prMenuItem = page.locator('#pr-menu-item');
      const prModal = page.locator('#pr-management-modal');
      const closeBtn = page.locator('#close-pr-management');

      // Open PR modal
      await menuBtn.click();
      await prMenuItem.click();
      await expect(prModal).toBeVisible();

      // Close with button
      await closeBtn.click();
      await expect(prModal).toHaveClass(/hidden/);
    });

    test('closes PR management modal with backdrop click', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const prMenuItem = page.locator('#pr-menu-item');
      const prModal = page.locator('#pr-management-modal');

      // Open PR modal
      await menuBtn.click();
      await prMenuItem.click();
      await expect(prModal).toBeVisible();

      // Click backdrop to close
      await prModal.click();
      await expect(prModal).toHaveClass(/hidden/);
    });
  });

  test.describe('Help Modal', () => {
    test('opens help modal', async ({ page }) => {
      const helpBtn = page.locator('#help-btn');
      const helpModal = page.locator('#help-modal');

      // Click help button
      await helpBtn.click();
      
      // Modal should be visible
      await expect(helpModal).not.toHaveClass(/hidden/);
      await expect(helpModal).toBeVisible();
    });

    test('closes help modal with close button', async ({ page }) => {
      const helpBtn = page.locator('#help-btn');
      const helpModal = page.locator('#help-modal');
      const closeBtn = page.locator('#close-help');

      // Open help modal
      await helpBtn.click();
      await expect(helpModal).toBeVisible();

      // Close with button
      await closeBtn.click();
      await expect(helpModal).toHaveClass(/hidden/);
    });

    test('closes help modal with backdrop click', async ({ page }) => {
      const helpBtn = page.locator('#help-btn');
      const helpModal = page.locator('#help-modal');

      // Open help modal
      await helpBtn.click();
      await expect(helpModal).toBeVisible();

      // Click backdrop to close
      await helpModal.click();
      await expect(helpModal).toHaveClass(/hidden/);
    });
  });

  test.describe('Modal Isolation', () => {
    test('menu closes when modal opens', async ({ page }) => {
      const menuBtn = page.locator('#menu-btn');
      const menuDropdown = page.locator('#menu-dropdown');
      const settingsMenuItem = page.locator('#settings-menu-item');
      const settingsModal = page.locator('#settings-modal');

      // Open menu
      await menuBtn.click();
      await expect(menuDropdown).not.toHaveClass(/hidden/);

      // Open settings modal
      await settingsMenuItem.click();
      await expect(settingsModal).toBeVisible();

      // Menu should be closed
      await expect(menuDropdown).toHaveClass(/hidden/);
    });

    test('only one modal visible at a time', async ({ page }) => {
      const helpBtn = page.locator('#help-btn');
      const helpModal = page.locator('#help-modal');
      const menuBtn = page.locator('#menu-btn');
      const settingsMenuItem = page.locator('#settings-menu-item');
      const settingsModal = page.locator('#settings-modal');

      // Open help modal first
      await helpBtn.click();
      await expect(helpModal).toBeVisible();

      // Try to open settings modal
      await menuBtn.click();
      await settingsMenuItem.click();
      await expect(settingsModal).toBeVisible();

      // Help modal should be closed
      await expect(helpModal).toHaveClass(/hidden/);
    });
  });
});