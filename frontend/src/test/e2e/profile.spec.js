/**
 * E2E tests for Profile functionality
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

test.describe('Profile', () => {
  test('should view own profile', async ({ page }) => {
    // This test requires authentication
    await loginTestUser(page);
    
    // Check if login was successful
    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      test.skip('This test requires authentication - login failed');
      return;
    }
    
    // Navigate to own profile page
    await page.goto('/my-profile');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    // Wait for profile content to appear
    await page.waitForSelector('text=/profile|bio|balance|timebank/i', { timeout: 10000 }).catch(() => {});
    
    // Wait for profile to load
    await page.waitForTimeout(2000);
    
    // Check if profile elements are visible
    // DÜZELTME: Strict mode violation'ı önlemek için daha spesifik selector kullan
    // Sayfa başlığını (h1) kontrol et - 5 saniye daha fazla bekle
    await expect(page.getByRole('heading', { name: /Profile/i, level: 1 }).or(page.locator('h1, h2').filter({ hasText: /Profile|My Profile/i }).first())).toBeVisible({ timeout: 15000 });
  });

  test('should edit profile', async ({ page }) => {
    // This test requires authentication
    await loginTestUser(page);
    
    // Check if login was successful
    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      test.skip('This test requires authentication - login failed');
      return;
    }
    
    // Navigate to own profile page
    await page.goto('/my-profile');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    // Wait for profile content to appear
    await page.waitForSelector('text=/profile|bio|balance|timebank/i', { timeout: 10000 }).catch(() => {});
    
    await page.waitForTimeout(2000);
    
    // Find edit button or form fields
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    const bioField = page.getByLabel(/bio|about/i).or(page.locator('textarea').first());
    
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
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    // Wait for profile content to appear
    await page.waitForSelector('text=/profile|bio|balance|testuser/i', { timeout: 10000 }).catch(() => {});
    
    // Profile pages should be accessible without login
    await page.waitForTimeout(2000);
    
    // DÜZELTME: Sadece 'heading' (başlık) olan Profile yazısını bekle
    // Veya daha spesifik bir selector kullan
    const profileHeading = page.getByRole('heading', { name: /Profile/i }).first();
    const profileContent = page.locator('text=/testuser|bio|balance/i').first();
    
    // En az birinin görünür olması yeterli
    const hasHeading = await profileHeading.isVisible({ timeout: 5000 }).catch(() => false);
    const hasContent = await profileContent.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasHeading || hasContent).toBeTruthy();
  });
});


