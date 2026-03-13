import { test, expect } from '@playwright/test';
import { mockInfluencerPoolApi } from './helpers/mockInfluencerApi.js';

test.describe('Campaign Lifecycle', () => {
  test('should display campaign list page', async ({ page }) => {
    await page.goto('/campaigns');
    // CampaignList renders h1 with "캠페인 빌더"
    await expect(page.getByRole('heading', { name: '캠페인 빌더' })).toBeVisible();
  });

  test('should navigate to campaign creation', async ({ page }) => {
    await page.goto('/campaigns/new');
    // CampaignCreate renders h1 with "새 캠페인 만들기"
    await expect(page.getByRole('heading', { name: '새 캠페인 만들기' })).toBeVisible();
  });

  test('should display settings page with all tabs', async ({ page }) => {
    await page.goto('/settings');
    // SettingsPage renders h1 "설정"
    await expect(page.getByRole('heading', { name: '설정', exact: true })).toBeVisible();
    // Check for all 5 settings tabs
    await expect(page.getByRole('tab', { name: /일반/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /브랜드 DNA/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /P\.D\.A\./ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /권한 관리/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /팀 관리/ })).toBeVisible();
  });

  test('should navigate to content engine', async ({ page }) => {
    await page.goto('/content-engine');
    // ContentEngine renders h1 "콘텐츠 엔진"
    await expect(page.getByRole('heading', { name: '콘텐츠 엔진' })).toBeVisible();
  });

  test('should navigate to creator hub', async ({ page }) => {
    await mockInfluencerPoolApi(page);
    await page.goto('/creator-hub');
    // CreatorHub renders h1 "Creator Hub"
    await expect(page.getByRole('heading', { name: 'Creator Hub' })).toBeVisible();
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });
});
