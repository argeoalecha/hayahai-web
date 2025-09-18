import { test, expect } from '@playwright/test'

test.describe('Blog Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display homepage with posts', async ({ page }) => {
    // Check hero section
    await expect(page.locator('h1')).toContainText('Hayah AI')

    // Check posts section
    await expect(page.locator('[data-testid="posts-section"]')).toBeVisible()

    // Check navigation
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=Technology')).toBeVisible()
    await expect(page.locator('text=Travel')).toBeVisible()
    await expect(page.locator('text=Sites')).toBeVisible()
  })

  test('should navigate to category pages', async ({ page }) => {
    await page.click('text=Technology')
    await expect(page).toHaveURL('/category/technology')
    await expect(page.locator('h1')).toContainText('Technology')

    await page.click('text=Travel')
    await expect(page).toHaveURL('/category/travel')
    await expect(page.locator('h1')).toContainText('Travel')

    await page.click('text=Sites')
    await expect(page).toHaveURL('/category/sites')
    await expect(page.locator('h1')).toContainText('Sites')
  })

  test('should handle search functionality', async ({ page }) => {
    // Open search
    await page.click('[data-testid="search-button"]')
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()

    // Search for content
    await page.fill('[data-testid="search-input"]', 'technology')
    await page.press('[data-testid="search-input"]', 'Enter')

    await expect(page).toHaveURL('/search?q=technology')
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
  })

  test('should display post detail page', async ({ page }) => {
    // Assuming there's at least one post
    await page.click('[data-testid="post-link"]:first-child')

    // Check post content
    await expect(page.locator('article')).toBeVisible()
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="post-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="post-meta"]')).toBeVisible()

    // Check comments section
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible()
  })

  test('should handle comment submission', async ({ page }) => {
    // Go to a post
    await page.click('[data-testid="post-link"]:first-child')

    // Fill comment form (for anonymous users)
    await page.fill('[data-testid="comment-name"]', 'Test User')
    await page.fill('[data-testid="comment-email"]', 'test@example.com')
    await page.fill('[data-testid="comment-content"]', 'This is a test comment')

    await page.click('[data-testid="submit-comment"]')

    // Should show pending approval message
    await expect(page.locator('text=Comment submitted for approval')).toBeVisible()
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Check desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible()
  })

  test('should handle error pages', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-post')
    await expect(page.locator('text=404')).toBeVisible()
    await expect(page.locator('text=Page not found')).toBeVisible()

    // Check return home link
    await page.click('text=Go back home')
    await expect(page).toHaveURL('/')
  })

  test('should load performance metrics within acceptable limits', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)

    // Check Core Web Vitals
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })

        setTimeout(() => resolve(null), 5000)
      })
    })

    if (lcp) {
      expect(lcp).toBeLessThan(2500) // LCP should be under 2.5s
    }
  })
})