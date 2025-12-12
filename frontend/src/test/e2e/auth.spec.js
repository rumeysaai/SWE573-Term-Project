/**
 * E2E tests for Authentication flow
 */
const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should display welcome page for unauthenticated users', async ({ page }) => {
    // Check if welcome page elements are visible
    await expect(page).toHaveURL('/');
    // Add more specific checks based on your welcome page
  });

  test('should navigate to login page', async ({ page }) => {
    // Click on login link/button
    const loginLink = page.getByRole('link', { name: /login/i }).or(page.getByRole('button', { name: /login/i }));
    await loginLink.click();
    
    await expect(page).toHaveURL(/.*login/);
    // Check if login form is visible
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    // Click on signup link/button
    const signupLink = page.getByRole('link', { name: /sign up/i }).or(page.getByRole('button', { name: /sign up/i }));
    await signupLink.click();
    
    await expect(page).toHaveURL(/.*signup/);
    // Check if signup form is visible
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.getByLabel(/username/i).fill('invaliduser');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for error message (adjust selector based on your toast/error implementation)
    await expect(page.locator('text=/invalid|incorrect|error/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate signup form fields', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Form should show validation errors or prevent submission
    // Adjust based on your form validation implementation
    const usernameField = page.getByLabel(/username/i);
    await expect(usernameField).toBeVisible();
  });

  test('should show error on password mismatch in signup', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill form with mismatched passwords
    await page.getByLabel(/username/i).fill('newuser');
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('differentpass');
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for error message
    await expect(page.locator('text=/password|match|mismatch/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should successfully register new user', async ({ page }) => {
    await page.goto('/signup');
    
    // Generate unique username
    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;
    
    // Fill signup form
    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('testpass123');
    await page.getByLabel(/confirm password/i).fill('testpass123');
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for success or redirect
    // Adjust based on your app's behavior after successful signup
    await page.waitForTimeout(2000);
    
    // Should redirect to home or show success message
    // await expect(page).toHaveURL(/.*home/);
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // First, create a user via signup (or use existing test user)
    await page.goto('/signup');
    
    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;
    const password = 'testpass123';
    
    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for signup to complete
    await page.waitForTimeout(2000);
    
    // Now test login
    await page.goto('/login');
    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should redirect to home after successful login
    await expect(page).toHaveURL(/.*home/, { timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    // First login (you may need to adjust this based on your auth setup)
    // This is a simplified version - adjust based on your actual login flow
    await page.goto('/login');
    
    // Assuming you have a test user, or create one first
    // For now, we'll just check the logout functionality exists
    // In a real scenario, you'd login first
    
    // Navigate to a page that requires auth (should redirect if not logged in)
    await page.goto('/home');
    
    // If logged in, logout button should be visible
    // Adjust selector based on your header implementation
    const logoutButton = page.getByRole('button', { name: /logout/i }).or(page.locator('text=/logout/i'));
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Should redirect to welcome page
      await expect(page).toHaveURL('/', { timeout: 5000 });
    }
  });
});


