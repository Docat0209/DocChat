import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /sign in/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /continue with google/i })
    ).toBeVisible()
  })

  test('signup page renders', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByText('Create an account')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /create account/i })
    ).toBeVisible()
  })

  test('unauthenticated user redirected from dashboard to login', async ({
    page,
  }) => {
    await page.context().clearCookies()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login with email/password redirects to dashboard', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('test@docchat.dev')
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('TestPass123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('authenticated user on / redirected to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('test@docchat.dev')
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('TestPass123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('test@docchat.dev')
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('TestPass123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    await page.getByRole('button', { name: /logout/i }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})
