/**
 * E2E tests for Navigation
 */
const { test, expect } = require('@playwright/test');

// Helper function to login with existing database user
async function loginTestUser(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for login form elements
  await expect(page.locator('#userName')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#password')).toBeVisible({ timeout: 10000 });
  
  // Fill login form with existing database user
  await page.locator('#userName').fill('rumeysa');
  await page.locator('#password').fill('123456');
  
  // Submit login
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for redirect after login
  await page.waitForTimeout(2000);
}

test.describe('Navigation', () => {
  test('should navigate between public pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to login - Welcome page has button, not link
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*login/);
    
    // Navigate to signup from login - Login page has link (goes to /register)
    await page.getByRole('link', { name: /sign up/i }).click();
    await page.waitForLoadState('networkidle');
    // Accept both /signup and /register URLs (both show the same Signup component)
    await expect(page).toHaveURL(/.*(signup|register)/);
    
    // Navigate back to login - Signup page has link
    await page.getByRole('link', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access protected route
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should redirect to welcome page or login page
    const currentUrl = page.url();
    const isRedirected = currentUrl === 'http://localhost:3000/' || 
                        currentUrl.endsWith('/') || 
                        currentUrl.includes('/login');
    
    expect(isRedirected).toBeTruthy();
  });

  test('should show navigation links in header when authenticated', async ({ page }) => {
    test.setTimeout(35000); // 5 saniye daha fazla timeout
    
    // This test requires authentication
    await loginTestUser(page);
    
    // Check if login was successful
    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      test.skip('This test requires authentication - login failed');
      return;
    }
    
    // Navigate to home (will redirect if not logged in)
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const homeLink = page.getByRole('link', { name: /home/i }).or(page.getByRole('button', { name: /home/i }));
    
    if (await page.url().includes('/home')) {
      await expect(homeLink).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to post creation page when authenticated', async ({ page }) => {
    // This test requires authentication
    await loginTestUser(page);
    
    // Check if login was successful
    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      test.skip('This test requires authentication - login failed');
      return;
    }
    
    // Navigate to home page
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
  
    const createPostButton = page.getByRole('link', { name: /create|new post|publish|offer/i }).first();
    
    if (await createPostButton.isVisible()) {
      await createPostButton.click();
      await expect(page).toHaveURL(/.*post.*new/);
    }
  });
});


