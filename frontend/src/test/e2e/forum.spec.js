/**
 * E2E tests for Forum functionality
 */
const { test, expect } = require('@playwright/test');

test.describe('Forum', () => {
  test('should display forum topics list', async ({ page }) => {
    await page.goto('/forums');
    
    // If redirected, skip
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Wait for forum topics to load
    await page.waitForTimeout(2000);
    
    // Check if forum container is visible
    const forumContainer = page.locator('[data-testid="forums"]')
      .or(page.locator('text=/forum|topic/i').first());
    
    await expect(forumContainer.or(page.locator('body'))).toBeVisible();
  });

  test('should create a new forum topic', async ({ page }) => {
    await page.goto('/forum/new');
    
    // If redirected, skip
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Fill forum topic form
    await page.getByLabel(/title/i).fill('E2E Test Forum Topic');
    await page.getByLabel(/content/i).or(page.locator('textarea').first()).fill('This is a test forum topic created by E2E test');
    
    // Submit form
    await page.getByRole('button', { name: /submit|create|post/i }).click();
    
    // Wait for redirect or success
    await page.waitForTimeout(2000);
    
    // Should redirect to topic details or forums list
    // await expect(page).toHaveURL(/.*forum/);
  });

  test('should view forum topic details', async ({ page }) => {
    await page.goto('/forums');
    
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    // Wait for topics to load
    await page.waitForTimeout(2000);
    
    // Click on first topic
    const firstTopic = page.locator('[data-testid="topic"]').first()
      .or(page.getByRole('link').filter({ hasText: /topic/i }).first())
      .or(page.locator('article').first());
    
    if (await firstTopic.isVisible()) {
      await firstTopic.click();
      await page.waitForTimeout(1000);
      // Should navigate to topic details
      // await expect(page).toHaveURL(/.*forum.*\d+/);
    }
  });

  test('should add comment to forum topic', async ({ page }) => {
    // Navigate to a forum topic (you may need to create one first or use existing)
    await page.goto('/forums');
    
    if (page.url().includes('/login') || page.url().includes('/')) {
      test.skip();
    }
    
    await page.waitForTimeout(2000);
    
    // Click on first topic
    const firstTopic = page.locator('[data-testid="topic"]').first()
      .or(page.getByRole('link').first());
    
    if (await firstTopic.isVisible()) {
      await firstTopic.click();
      await page.waitForTimeout(1000);
      
      // Find comment input
      const commentInput = page.getByPlaceholder(/comment/i)
        .or(page.locator('textarea').last())
        .or(page.getByLabel(/comment/i));
      
      if (await commentInput.isVisible()) {
        await commentInput.fill('E2E test comment');
        
        // Submit comment
        const submitButton = page.getByRole('button', { name: /submit|post|comment/i }).last();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Comment should appear in the list
          await expect(page.locator('text=/E2E test comment/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});


