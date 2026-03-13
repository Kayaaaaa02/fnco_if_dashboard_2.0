export async function mockInfluencerPoolApi(page, overrides = {}) {
  const list = overrides.list ?? [
    {
      id: 1,
      name: '테스트 인플루언서',
      platform: 'instagram',
      category: '마이크로',
      followers: 12000,
      avgViews: 3200,
      quickSummary: 'E2E 테스트용 모킹 데이터',
      isSaved: false,
      profileUrl: 'https://example.com/profile',
    },
  ];
  const count = overrides.count ?? list.length;

  await page.route('**/api/influencer/list**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, list }),
    });
  });

  await page.route('**/api/influencer/count**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, count }),
    });
  });
}
