import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Upload and Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('test@docchat.dev')
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('TestPass123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('dashboard shows upload area', async ({ page }) => {
    await expect(
      page.getByText(/click to upload or drag and drop/i)
    ).toBeVisible()
  })

  test('upload TXT file and navigate to chat', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByLabel('Upload document').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(
      path.join(__dirname, '../fixtures/sample.txt')
    )

    await expect(page).toHaveURL(/\/chat\//, { timeout: 30000 })
    await expect(page.getByText('sample.txt')).toBeVisible({ timeout: 10000 })
  })

  test('send chat message and get response', async ({ page }) => {
    const docLink = page.locator('[data-testid="document-item"]').first()

    if (!(await docLink.isVisible({ timeout: 3000 }).catch(() => false))) {
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByLabel('Upload document').click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(
        path.join(__dirname, '../fixtures/sample.txt')
      )
      await expect(page).toHaveURL(/\/chat\//, { timeout: 30000 })
    } else {
      await docLink.click()
      await expect(page).toHaveURL(/\/chat\//, { timeout: 5000 })
    }

    await expect(
      page.getByPlaceholder(/ask a question/i)
    ).toBeVisible({ timeout: 10000 })

    await page
      .getByPlaceholder(/ask a question/i)
      .fill('What is this document about?')
    await page.getByPlaceholder(/ask a question/i).press('Enter')

    await expect(
      page
        .locator(
          '[data-testid="assistant-message"], .text-muted-foreground'
        )
        .first()
    ).toBeVisible({ timeout: 30000 })
  })
})
