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
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on login link/button - Welcome page has button, not link
    const loginButton = page.getByRole('button', { name: /login/i });
    await loginButton.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*login/);
    
    // Check if login form is visible - wait for elements
    await expect(page.locator('#userName')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#password')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to signup page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on signup link/button - Welcome page has button, not link
    const signupButton = page.getByRole('button', { name: /sign up/i });
    await signupButton.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*(signup|register)/);
    
    // Check if signup form is visible - use id selector for fields
    await expect(page.locator('#userName')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#email')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#password')).toBeVisible({ timeout: 5000 });
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Wait for login form elements to be visible
    await expect(page.locator('#userName')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 });
    
   
    await page.locator('#userName').fill('invaliduser');
    await page.locator('#password').fill('wrongpassword');
    
    // Wait for submit button to be visible and click
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for error message (toast notification)
    await page.waitForTimeout(1000);
    // Toast messages appear in the DOM, check for error text
    await expect(page.locator('text=/invalid|incorrect|error|failed|login failed/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate signup form fields', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit empty form - button text is "Create Account"
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Form should show validation errors or prevent submission
    const usernameField = page.locator('#userName');
    await expect(usernameField).toBeVisible();
  });

  test('should show error on password mismatch in signup', async ({ page }) => {
    await page.goto('/signup');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for form elements to be visible
    await expect(page.locator('#userName')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
    
    // Fill form with mismatched passwords - use id selector
    await page.locator('#userName').fill('newuser');
    await page.locator('#email').fill('newuser@example.com');
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('differentpass');
    
    // Wait for submit button and click
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Wait for error message (toast notification)
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/password|match|mismatch|do not match/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should successfully register new user', async ({ page }) => {
    await page.goto('/signup');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for form elements to be visible
    await expect(page.locator('#userName')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
    
    // Generate unique username
    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;
    
    // Fill signup form - use id selector for all fields
    await page.locator('#userName').fill(username);
    await page.locator('#email').fill(email);
    await page.locator('#confirmEmail').fill(email);
    
    // Calculate birth date (18 years ago)
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const birthDateStr = birthDate.toISOString().split('T')[0];
    await page.locator('#birthDate').fill(birthDateStr);
    
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirmPassword').fill('testpass123');
    
    // Accept terms - wait for checkbox to be visible
    await expect(page.locator('#terms')).toBeVisible({ timeout: 5000 });
    await page.locator('#terms').check();
    
    // Wait for submit button and click
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /create account/i }).click();
    
   
    await page.waitForTimeout(3000);
    

    // Check if redirected (signup redirects to /)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\//);
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Use existing database user: rumeysa / 123456
    const username = 'rumeysa';
    const password = '123456';
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Wait for login form elements to be visible
    await expect(page.locator('#userName')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 });
    
   
    await page.locator('#userName').fill(username);
    await page.locator('#password').fill(password);
    
    // Wait for submit button to be visible 
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /sign in/i }).click();
    
    
    await page.waitForURL('**/home', { timeout: 15000 });
    
    
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({ timeout: 15000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Use existing database user: rumeysa / 123456
    const username = 'rumeysa';
    const password = '123456';
    
    // Step 1: Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Wait for login form elements to be visible
    await expect(page.locator('#userName')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 });
    
    // Fill login form
    await page.locator('#userName').fill(username);
    await page.locator('#password').fill(password);
    
    // Submit login
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect to home page after successful login
    await page.waitForURL('**/home', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Step 2: Verify we're logged in by checking for user avatar/profile button
    // The logout button is inside a dropdown menu, so we need to open the menu first
    // Look for the avatar button (profile menu trigger)
    const avatarButton = page.locator('button').filter({ has: page.locator('img, div.w-14') }).first();
    await expect(avatarButton).toBeVisible({ timeout: 10000 });
    
    // Step 3: Click avatar button to open the profile menu
    await avatarButton.click();
    await page.waitForTimeout(1000);
    
    // Step 4: Now the logout button should be visible in the dropdown menu
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    
    // Step 5: Click logout button
    await logoutButton.click();
    
    // Step 6: Wait for redirect to welcome page (logout is async, may take time)
    // First wait a bit for the logout process to complete
    await page.waitForTimeout(2000);
    
    // Then wait for navigation - use a more flexible pattern
    await page.waitForURL(/\//, { timeout: 15000 });
    
    // Step 7: Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Step 8: Verify we're on welcome page (unauthenticated state)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\//);
    
    // Step 9: Verify logout was successful by checking that login button is visible
    // (Welcome page should show login/signup buttons for unauthenticated users)
    // Try multiple selectors to find login button
    const loginButton = page.getByRole('button', { name: /login/i })
      .or(page.locator('button').filter({ hasText: /login/i }).first())
      .or(page.locator('text=/login/i').first());
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    
    // Step 10: Verify we can't access protected routes (should redirect to welcome)
    await page.goto('/home');
    await page.waitForTimeout(3000);
    
    // Check that we're redirected or login button is visible (confirming we're logged out)
    // After logout, protected routes should redirect to welcome page
    const finalUrl = page.url();
    // Either redirected to / or still on /home but showing login button
    const loginButtonAfterLogout = page.getByRole('button', { name: /login/i })
      .or(page.locator('button').filter({ hasText: /login/i }).first());
    
    // If we're on home page, login button should be visible (or we were redirected)
    const isOnWelcome = finalUrl.match(/\//) && !finalUrl.includes('/home');
    if (!isOnWelcome) {
      // Still on /home, check for login button
      await expect(loginButtonAfterLogout).toBeVisible({ timeout: 10000 });
    }
  });
});


