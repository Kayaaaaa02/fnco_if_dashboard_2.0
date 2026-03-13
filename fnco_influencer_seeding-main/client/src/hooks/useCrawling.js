import { useMutation } from '@tanstack/react-query';

const V1_BASE = '/api/crawling';

/**
 * V1 API JSON 요청 헬퍼
 */
async function v1Fetch(path, options = {}) {
  const url = `${V1_BASE}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * 단일 URL 크롤링
 * mutationFn 인자: { url }
 * 반환: 크롤링된 데이터 (platform, author, thumbnail, stats 등)
 */
export function useCrawlUrl() {
  return useMutation({
    mutationFn: ({ url }) =>
      v1Fetch('/', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
  });
}

/**
 * 다중 URL 일괄 크롤링
 * mutationFn 인자: { urls: string[] }
 * 반환: 크롤링 결과 배열
 */
export function useBatchCrawl() {
  return useMutation({
    mutationFn: ({ urls }) =>
      v1Fetch('/batch', {
        method: 'POST',
        body: JSON.stringify({ urls }),
      }),
  });
}
