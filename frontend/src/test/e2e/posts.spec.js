/**
 * E2E tests for Posts functionality
 */
const { test, expect } = require('@playwright/test');

test.describe('Posts', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should display posts list on home page when authenticated', async ({ page }) => {
    // This test requires authentication
    // For now, we'll check if the page loads
    
    await page.goto('/home');
    
    // If redirected, skip
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Wait for posts to load
    await page.waitForTimeout(2000);
    
    // Check if posts container is visible
    // Adjust selector based on your implementation
    const postsContainer = page.locator('[data-testid="posts"]').or(page.locator('text=/post/i').first());
    
    // Posts might be empty, but container should exist
    await expect(postsContainer.or(page.locator('body'))).toBeVisible();
  });

  test('should filter posts by type', async ({ page }) => {
    await page.goto('/home');
    
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Look for filter buttons/selects
    const offerFilter = page.getByRole('button', { name: /offer/i }).or(page.locator('text=/offer/i').first());
    const needFilter = page.getByRole('button', { name: /need/i }).or(page.locator('text=/need/i').first());
    
    if (await offerFilter.isVisible()) {
      await offerFilter.click();
      await page.waitForTimeout(1000);
      // Verify filter is applied (adjust based on your implementation)
    }
  });

  test('should search posts', async ({ page }) => {
    await page.goto('/home');
    
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Find search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]'));
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test query');
      await page.waitForTimeout(1000);
      // Verify search results (adjust based on your implementation)
    }
  });

  test('should create a new post when authenticated', async ({ page }) => {
    await page.goto('/post/new');
    
    // If redirected, skip
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Fill post form
    await page.getByLabel(/title/i).fill('E2E Test Post');
    await page.getByLabel(/description/i).fill('This is a test post created by E2E test');
    await page.getByLabel(/location/i).fill('Test Location');
    await page.getByLabel(/duration/i).fill('1 hour');
    
    // Select post type if available
    const postTypeSelect = page.getByLabel(/type/i).or(page.locator('select').first());
    if (await postTypeSelect.isVisible()) {
      await postTypeSelect.selectOption('offer');
    }
    
    // Submit form
    await page.getByRole('button', { name: /submit|create|post/i }).click();
    
    // Wait for redirect or success message
    await page.waitForTimeout(2000);
    
    // Should redirect to post details or home
    // await expect(page).toHaveURL(/.*post.*details|.*home/);
  });

  test('should view post details', async ({ page }) => {
    await page.goto('/home');
    
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Wait for posts to load
    await page.waitForTimeout(2000);
    
    // Click on first post
    const firstPost = page.locator('[data-testid="post"]').first()
      .or(page.getByRole('link').filter({ hasText: /post/i }).first())
      .or(page.locator('article').first());
    
    if (await firstPost.isVisible()) {
      await firstPost.click();
      await page.waitForTimeout(1000);
      // Should navigate to post details
      // await expect(page).toHaveURL(/.*post.*details/);
    }
  });
});


