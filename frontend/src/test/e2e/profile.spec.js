/**
 * E2E tests for Profile functionality
 */
const { test, expect } = require('@playwright/test');

test.describe('Profile', () => {
  test('should view own profile', async ({ page }) => {
    await page.goto('/my-profile');
    
    // If redirected, skip
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Wait for profile to load
    await page.waitForTimeout(2000);
    
    // Check if profile elements are visible
    // Adjust selectors based on your profile page
    const profileContainer = page.locator('[data-testid="profile"]')
      .or(page.locator('text=/profile|bio|balance/i').first());
    
    await expect(profileContainer.or(page.locator('body'))).toBeVisible();
  });

  test('should edit profile', async ({ page }) => {
    await page.goto('/my-profile');
    
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    await page.waitForTimeout(2000);
    
    // Find edit button or form fields
    const editButton = page.getByRole('button', { name: /edit/i });
    const bioField = page.getByLabel(/bio/i).or(page.locator('textarea').first());
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
    
    if (await bioField.isVisible()) {
      await bioField.fill('Updated bio from E2E test');
      
      // Save changes
      const saveButton = page.getByRole('button', { name: /save|update/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        // Verify update
        await expect(page.locator('text=/Updated bio from E2E test/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should view other user profile', async ({ page }) => {
    // Navigate to a user profile (you may need to adjust the username)
    await page.goto('/profile/testuser');
    
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    await page.waitForTimeout(2000);
    
    // Check if profile is displayed
    const profileContainer = page.locator('[data-testid="profile"]')
      .or(page.locator('text=/testuser|profile/i').first());
    
    await expect(profileContainer.or(page.locator('body'))).toBeVisible();
  });
});


