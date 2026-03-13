import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');

    // LoginPage renders "F&CO Beauty Content Engine" heading
    await expect(page.getByText('F&CO Beauty Content Engine')).toBeVisible();
  });

  test('should display region selection buttons on login page', async ({ page }) => {
    await page.goto('/login');

    // Login page shows three region cards
    await expect(page.getByRole('heading', { name: 'Global', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Korea', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'China', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter Command Center' })).toHaveCount(3);
  });

  test('should display command center entry buttons', async ({ page }) => {
    await page.goto('/login');

    const entryButtons = page.getByRole('button', { name: 'Enter Command Center' });
    await expect(entryButtons.first()).toBeVisible();
  });

  test('should show contact information on login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('문의사항이 있으시면 아래 담당자에게 문의 부탁드립니다.')).toBeVisible();
  });
});
