import { test, expect } from '@playwright/test';
import { mockInfluencerPoolApi } from './helpers/mockInfluencerApi.js';

test.describe('Navigation', () => {
  test('should have working sidebar links', async ({ page }) => {
    await mockInfluencerPoolApi(page);
    await page.goto('/campaigns');

    // Sidebar should contain all main nav items
    const sidebar = page.locator('aside');
    await expect(sidebar.getByRole('button', { name: '캠페인 빌더' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: '콘텐츠 엔진' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: '크리에이터 허브' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: '인플루언서 풀' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Analytics' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: '설정' })).toBeVisible();

    // Click "콘텐츠 엔진" link and verify navigation
    await sidebar.getByRole('link', { name: '콘텐츠 엔진' }).click();
    await expect(page.getByRole('heading', { name: '콘텐츠 엔진' })).toBeVisible();

    // Click "Analytics" link and verify navigation
    await sidebar.getByRole('link', { name: 'Analytics' }).click();
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();

    // Click "설정" link and verify navigation
    await sidebar.getByRole('link', { name: '설정' }).click();
    await expect(page.getByRole('heading', { name: '설정', exact: true })).toBeVisible();

    // Click "인플루언서 풀" link and verify navigation
    await sidebar.getByRole('link', { name: '인플루언서 풀' }).click();
    await expect(page.getByRole('heading', { name: '인플루언서 풀' })).toBeVisible();

    // Click "크리에이터 허브" link and navigate back
    await sidebar.getByRole('link', { name: '크리에이터 허브' }).click();
    await expect(page.getByRole('heading', { name: 'Creator Hub' })).toBeVisible();
  });

  test('should show notification bell in header', async ({ page }) => {
    await page.goto('/campaigns');

    // The header contains a NotificationBell component with a Bell icon button
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // NotificationBell renders a button with the bell icon
    const bellButton = header.locator('button').first();
    await expect(bellButton).toBeVisible();
  });

  test('should show header account actions', async ({ page }) => {
    await page.goto('/creator-hub');

    // Header should include account info and action buttons
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('Drake(김승범) F/KR/DD(CDO)', { exact: true })).toBeVisible();
    await expect(header.getByText('drake@fncorp.com', { exact: true })).toBeVisible();
    await expect(header.getByRole('button', { name: '로그아웃' })).toBeVisible();
    await expect(header.getByRole('button', { name: '권한관리' })).toBeVisible();
  });

  test('should display FNCO logo in sidebar', async ({ page }) => {
    await page.goto('/campaigns');

    // AppLayout sidebar shows "F" logo box and "FNCO" text
    const sidebar = page.locator('aside');
    await expect(sidebar.getByText('FNCO', { exact: true })).toBeVisible();
  });

  test('should show campaign status shortcuts in sidebar', async ({ page }) => {
    await page.goto('/campaigns');

    // Sidebar should include campaign status items after clicking campaign builder
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: '캠페인 빌더' }).click();
    await expect(sidebar.getByRole('link', { name: 'NEW' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: '진행중' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: '완료' })).toBeVisible();
  });

  test('should switch campaign builder page by status shortcuts', async ({ page }) => {
    await page.goto('/campaigns');

    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: '캠페인 빌더' }).click();

    await sidebar.getByRole('link', { name: 'NEW' }).click();
    await expect(page).toHaveURL(/\/campaigns\?status=draft/);
    await expect(page.getByRole('heading', { name: 'NEW 캠페인' })).toBeVisible();

    await sidebar.getByRole('link', { name: '진행중' }).click();
    await expect(page).toHaveURL(/\/campaigns\?status=active/);
    await expect(page.getByRole('heading', { name: '진행중 캠페인' })).toBeVisible();

    await sidebar.getByRole('link', { name: '완료' }).click();
    await expect(page).toHaveURL(/\/campaigns\?status=completed/);
    await expect(page.getByRole('heading', { name: '완료 캠페인' })).toBeVisible();
  });

  test('should redirect root to campaigns', async ({ page }) => {
    await page.goto('/');

    // Root path "/" should redirect to "/campaigns" via Navigate
    await expect(page).toHaveURL(/\/campaigns/);
    await expect(page.getByRole('heading', { name: '캠페인 빌더' })).toBeVisible();
  });
});
