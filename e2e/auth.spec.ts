import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display sign in form', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL('/auth/signin')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')

    // Submit empty form
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Email is required')).toBeVisible()

    // Submit with invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid email')).toBeVisible()
  })

  test('should handle OAuth providers', async ({ page }) => {
    await page.goto('/auth/signin')

    // Check OAuth buttons exist
    await expect(page.locator('text=Continue with Google')).toBeVisible()
    await expect(page.locator('text=Continue with GitHub')).toBeVisible()
  })

  test('should redirect to signup page', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/auth/signup')
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.click('text=Forgot password?')
    await expect(page).toHaveURL('/auth/forgot-password')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Reset link sent')).toBeVisible()
  })
})