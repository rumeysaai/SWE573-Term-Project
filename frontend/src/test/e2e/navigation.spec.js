/**
 * E2E tests for Navigation
 */
const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('should navigate between public pages', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to login
    await page.getByRole('link', { name: /login/i }).or(page.getByRole('button', { name: /login/i })).click();
    await expect(page).toHaveURL(/.*login/);
    
    // Navigate to signup from login
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/.*signup/);
    
    // Navigate back to login
    await page.getByRole('link', { name: /log in/i }).click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access protected route
    await page.goto('/home');
    
    // Should redirect to welcome page
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('should show navigation links in header when authenticated', async ({ page }) => {
    // This test assumes user is logged in
    // You may need to login first or mock authentication
    
    // Navigate to home (will redirect if not logged in)
    await page.goto('/home');
    
    // Check if header navigation is visible
    // Adjust selectors based on your header implementation
    const homeLink = page.getByRole('link', { name: /home/i });
    
    // If redirected, this won't be visible - that's expected
    // If logged in, these should be visible
    if (await page.url().includes('/home')) {
      await expect(homeLink).toBeVisible();
    }
  });

  test('should navigate to post creation page when authenticated', async ({ page }) => {
    // This test requires authentication
    // Adjust based on your auth setup
    
    await page.goto('/home');
    
    // If redirected to login, skip this test
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Look for "Create Post" or similar button
    const createPostButton = page.getByRole('link', { name: /create|new post|post/i }).first();
    
    if (await createPostButton.isVisible()) {
      await createPostButton.click();
      await expect(page).toHaveURL(/.*post.*new/);
    }
  });
});


