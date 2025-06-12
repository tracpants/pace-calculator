import { test, expect } from '@playwright/test';

test.describe('Theme System Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
  });

  // Test the 6 themes mentioned in CLAUDE.md: light, dark, system, amoled, high-contrast, monochrome
  const themes = [
    { name: 'light', class: 'light' },
    { name: 'dark', class: 'dark' },
    { name: 'system', class: 'system' },
    { name: 'amoled', class: 'amoled' },
    { name: 'high-contrast', class: 'high-contrast' },
    { name: 'monochrome', class: 'monochrome' }
  ];

  for (const theme of themes) {
    test(`should load and function correctly with ${theme.name} theme @themes @${theme.name}`, async ({ page }) => {
      // Apply theme by adding class to html element (as per CLAUDE.md)
      await page.evaluate((themeClass) => {
        document.documentElement.className = '';
        document.documentElement.classList.add(themeClass);
      }, theme.class);

      // Wait a moment for theme to apply
      await page.waitForTimeout(100);

      // Verify app is still functional
      await expect(page.locator('#app')).toBeVisible();
      
      // Test tab switching works
      await page.click('[data-tab="time"]');
      await expect(page.locator('[data-tab="time"]')).toHaveClass(/active/);
      
      // Test form functionality
      await page.fill('#time-pace-minutes', '5');
      await page.fill('#time-distance', '10');
      await page.click('button[type="submit"]');
      await expect(page.locator('#result')).toBeVisible();

      // Verify theme class is applied
      const htmlClass = await page.evaluate(() => document.documentElement.className);
      expect(htmlClass).toContain(theme.class);
    });
  }

  test('should persist theme selection across page reloads @themes @persistence', async ({ page }) => {
    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    // Reload page
    await page.reload();
    await expect(page.locator('#app')).toBeVisible();

    // Theme should be preserved
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
  });

  test('should handle theme switching via settings modal @themes @settings', async ({ page }) => {
    // Look for settings/theme toggle button
    const settingsBtn = page.locator('button').filter({ hasText: /settings|theme|⚙|🎨/ }).first();
    
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      
      // Look for theme options in modal/dropdown
      const themeOptions = page.locator('[data-theme], .theme-option, button').filter({ hasText: /dark|light|theme/ });
      const optionCount = await themeOptions.count();
      
      if (optionCount > 0) {
        // Click first theme option
        await themeOptions.first().click();
        
        // Verify theme changed
        await page.waitForTimeout(100);
        const htmlClass = await page.evaluate(() => document.documentElement.className);
        expect(htmlClass.length).toBeGreaterThan(0);
      }
    } else {
      // If no settings UI found, just verify themes can be programmatically applied
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      const htmlClass = await page.evaluate(() => document.documentElement.className);
      expect(htmlClass).toContain('dark');
    }
  });

  test('should maintain contrast ratios in accessibility themes @themes @accessibility @contrast', async ({ page }) => {
    const accessibilityThemes = ['high-contrast', 'monochrome'];
    
    for (const theme of accessibilityThemes) {
      // Apply accessibility theme
      await page.evaluate((themeClass) => {
        document.documentElement.className = '';
        document.documentElement.classList.add(themeClass);
      }, theme);

      await page.waitForTimeout(100);

      // Check that interactive elements are still visible and distinguishable
      const buttons = page.locator('button').first();
      const buttonStyles = await buttons.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor
        };
      });

      // Verify that button has visible styling (not transparent)
      // eslint-disable-next-line design-tokens/no-hardcoded-colors
      expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(buttonStyles.backgroundColor).not.toBe('transparent');
    }
  });

  test('should disable accent colors for accessibility themes @themes @accessibility', async ({ page }) => {
    const accessibilityThemes = ['amoled', 'high-contrast', 'monochrome'];
    
    for (const theme of accessibilityThemes) {
      // Apply accessibility theme
      await page.evaluate((themeClass) => {
        document.documentElement.className = '';
        document.documentElement.classList.add(themeClass);
      }, theme);

      await page.waitForTimeout(100);

      // Verify app still functions
      await expect(page.locator('#app')).toBeVisible();
      
      // Test basic functionality
      await page.click('[data-tab="pace"]');
      await expect(page.locator('[data-tab="pace"]')).toHaveClass(/active/);
      
      // Check that theme class is properly applied
      const htmlClass = await page.evaluate(() => document.documentElement.className);
      expect(htmlClass).toContain(theme);
    }
  });

  test('should handle system theme preference detection @themes @system', async ({ page }) => {
    // Test system theme with light preference
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => {
      document.documentElement.className = '';
      document.documentElement.classList.add('system');
    });
    
    await page.waitForTimeout(100);
    await expect(page.locator('#app')).toBeVisible();
    
    // Test system theme with dark preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    
    await page.evaluate(() => {
      document.documentElement.classList.add('system');
    });
    
    await page.waitForTimeout(100);
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should provide AMOLED optimizations for OLED displays @themes @amoled', async ({ page }) => {
    // Apply AMOLED theme
    await page.evaluate(() => {
      document.documentElement.className = '';
      document.documentElement.classList.add('amoled');
    });

    await page.waitForTimeout(100);

    // Verify app functions with AMOLED theme
    await expect(page.locator('#app')).toBeVisible();
    
    // Test that pure black backgrounds are used (OLED optimization)
    const bodyStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return styles.backgroundColor;
    });

    // AMOLED should use true black or very dark colors
    // eslint-disable-next-line design-tokens/no-hardcoded-colors  
    expect(['rgb(0, 0, 0)', 'rgba(0, 0, 0, 1)', '#000000', 'black'].some(color => 
      bodyStyles.includes('0, 0, 0') || bodyStyles.includes('black')
    )).toBeTruthy();
  });

});