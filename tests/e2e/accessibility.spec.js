import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should have semantic HTML structure @accessibility @structure', async ({ page }) => {
    // Check for main landmark
    await expect(page.locator('main')).toBeVisible();
    
    // Check for proper heading hierarchy
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for form elements
    await expect(page.locator('form')).toBeVisible();
    
    // Check that interactive elements have proper roles
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should support keyboard navigation throughout app @accessibility @keyboard', async ({ page }) => {
    // Test tab navigation through main interface
    await page.keyboard.press('Tab'); // Should focus first interactive element
    
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['BUTTON', 'INPUT', 'SELECT']).toContain(focusedElement);
    
    // Test that we can navigate to all tabs
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Should activate a tab
    
    // Verify tab was activated
    const activeTab = await page.locator('[aria-selected="true"]');
    await expect(activeTab).toBeVisible();
  });

  test('should have proper focus indicators @accessibility @focus', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    // Check that focused element has visible focus indicator
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Verify focus styling is applied (basic check)
    const focusStyles = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      };
    });
    
    // Should have some form of focus indicator
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' || 
      focusStyles.outlineWidth !== '0px' || 
      focusStyles.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBe(true);
  });

  test('should have appropriate color contrast @accessibility @contrast', async ({ page }) => {
    // Test that text elements have sufficient contrast
    // This is a basic implementation - in practice you might use axe-core
    
    const textElements = await page.locator('button, input, label, p, h1, h2, h3').all();
    expect(textElements.length).toBeGreaterThan(0);
    
    // Basic check that text is visible (not transparent)
    for (const element of textElements.slice(0, 5)) { // Check first 5 elements
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          opacity: computed.opacity
        };
      });
      
      // Ensure text is not completely transparent
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
    }
  });

  test('should work with screen reader patterns @accessibility @screenreader', async ({ page }) => {
    // Check for proper labeling
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      
      // Each input should have either a label, aria-label, or aria-labelledby
      const hasLabel = await input.evaluate(el => {
        const id = el.id;
        const hasAssociatedLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = el.getAttribute('aria-label');
        const hasAriaLabelledBy = el.getAttribute('aria-labelledby');
        
        return !!(hasAssociatedLabel || hasAriaLabel || hasAriaLabelledBy);
      });
      
      expect(hasLabel).toBe(true);
    }
  });

  test('should announce dynamic content changes @accessibility @live-regions', async ({ page }) => {
    // Fill out form to trigger result
    await page.fill('#pace-time-minutes', '4');
    await page.fill('#pace-time-seconds', '30');
    await page.fill('#pace-distance', '5');
    await page.click('button[type="submit"]');
    
    // Check that result area is properly announced
    const result = page.locator('#result');
    await expect(result).toBeVisible();
    
    // Should have aria-live or role="status" for screen reader announcements
    const hasLiveRegion = await result.evaluate(el => {
      const ariaLive = el.getAttribute('aria-live');
      const role = el.getAttribute('role');
      return ariaLive || role === 'status' || role === 'alert';
    });
    
    expect(hasLiveRegion).toBeTruthy();
  });

  test('should handle high contrast themes @accessibility @themes @contrast', async ({ page }) => {
    // Test that the app works in different color schemes
    
    // Simulate dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await expect(page.locator('#app')).toBeVisible();
    
    // Check that UI is still functional
    await page.click('[data-tab="time"]');
    await expect(page.locator('[data-tab="time"]')).toHaveClass(/active/);
    
    // Switch back to light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should support reduced motion preferences @accessibility @motion', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('#app')).toBeVisible();
    
    // App should still function with reduced motion
    await page.click('[data-tab="distance"]');
    await expect(page.locator('[data-tab="distance"]')).toHaveClass(/active/);
  });

  test('should be usable at 200% zoom @accessibility @zoom', async ({ page }) => {
    // Set zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    // Should still be functional
    await expect(page.locator('#app')).toBeVisible();
    await page.click('[data-tab="time"]');
    await expect(page.locator('[data-tab="time"]')).toHaveClass(/active/);
    
    // Form should still work
    await page.fill('#time-pace-minutes', '5');
    await page.fill('#time-distance', '10');
    await page.click('button[type="submit"]');
    await expect(page.locator('#result')).toBeVisible();
  });

});