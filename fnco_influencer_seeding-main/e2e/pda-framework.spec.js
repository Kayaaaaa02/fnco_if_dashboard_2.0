import { test, expect } from '@playwright/test';

test.describe('PDA Framework', () => {
  test('should load settings PDA tab', async ({ page }) => {
    // Navigate to settings page and switch to PDA tab
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: '설정', exact: true })).toBeVisible();

    // Click the PDA tab
    const pdaTab = page.getByRole('tab', { name: /P\.D\.A\./ });
    await expect(pdaTab).toBeVisible();
    await pdaTab.click();

    // PDA tab should now be selected
    await expect(pdaTab).toHaveAttribute('data-state', 'active');
  });

  test('should show campaign PDA page structure', async ({ page }) => {
    // Navigate to a campaign PDA page (using id=1 as example)
    // This will likely show an error or empty state since there is no backend,
    // but the route should resolve and the AppLayout should render
    await page.goto('/campaigns/1/pda');

    // The AppLayout sidebar should still be visible
    await expect(page.locator('aside').getByText('FNCO', { exact: true })).toBeVisible();

    // The page should have loaded (no blank screen)
    // Either PDASetup content or an error boundary should be present
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
