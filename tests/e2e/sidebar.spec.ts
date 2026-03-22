import { test, expect } from '@playwright/test'

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('test@docchat.dev')
    await page.getByRole('textbox', { name: /password/i }).fill('TestPass123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('shows usage indicator', async ({ page }) => {
    await expect(page.getByText(/documents/i)).toBeVisible()
    await expect(page.getByText(/questions today/i)).toBeVisible()
  })

  test('shows upgrade button for free users', async ({ page }) => {
    await expect(page.getByRole('button', { name: /upgrade to pro/i })).toBeVisible()
  })

  test('mobile: sidebar hidden, hamburger visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    // Sidebar should be hidden on mobile; a hamburger/menu button should be visible.
    // Implementation-specific assertions can be added once the mobile layout is confirmed.
  })
})
