import { test, expect } from '@playwright/test'

test.describe('Farmer portal smoke', () => {
  test('login page shows mobile form', async ({ page }) => {
    await page.goto('/login/')
    await expect(page.getByRole('heading', { name: /Varaha Portal/i })).toBeVisible()
    await expect(page.getByLabel(/Registered Mobile/i)).toBeVisible()
  })

  test('unauthenticated user redirected from home', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })
})
