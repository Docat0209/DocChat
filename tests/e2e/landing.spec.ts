import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('renders hero section', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: /chat with your documents/i })
    ).toBeVisible()
  })

  test('renders feature cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Upload Any Document')).toBeVisible()
    await expect(page.getByText('AI-Powered Answers')).toBeVisible()
    await expect(page.getByText('Source Citations')).toBeVisible()
    await expect(page.getByText('Chat History')).toBeVisible()
  })

  test('renders pricing section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('$0')).toBeVisible()
    await expect(page.getByText('$9')).toBeVisible()
  })

  test('CTA links to signup', async ({ page }) => {
    await page.goto('/')
    const ctaLink = page.getByRole('link', { name: /get started free/i })
    await expect(ctaLink).toHaveAttribute('href', '/signup')
  })
})
