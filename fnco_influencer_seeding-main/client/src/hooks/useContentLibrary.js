import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const V1_BASE = '/api/contents';

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
 * Fetch content list by type
 * @param {'seeding' | 'ugc' | 'preview' | 'performance'} type
 */
export function useContentLibrary(type = 'seeding') {
  return useQuery({
    queryKey: ['content-library', type],
    queryFn: () => v1Fetch(`/${type}`),
  });
}

/**
 * Delete content by type
 * V1 API uses DELETE with request body: { deletePara: ... }
 * @param {'seeding' | 'ugc' | 'preview'} type
 */
export function useDeleteContent(type) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deletePara) =>
      v1Fetch(`/${type}`, {
        method: 'DELETE',
        body: JSON.stringify({ deletePara }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library', type] });
    },
  });
}

/**
 * Update content by type
 * V1 API uses PUT with request body: { updatePara: ... }
 * @param {'seeding' | 'ugc' | 'preview'} type
 */
export function useUpdateContent(type) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatePara) =>
      v1Fetch(`/${type}`, {
        method: 'PUT',
        body: JSON.stringify({ updatePara }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library', type] });
    },
  });
}

/**
 * 시딩 콘텐츠 신규 등록
 * POST /api/contents/seeding
 */
export function useCreateSeedingContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      v1Fetch('/seeding', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library', 'seeding'] });
    },
  });
}

/**
 * UGC 뷰티 카테고리별 인사이트 조회
 * GET /api/contents/ugc/insights
 */
export function useUGCCategoryInsights(platform, createdDt) {
  const params = new URLSearchParams();
  if (platform) params.set('platform', platform);
  if (createdDt) params.set('created_dt', createdDt);
  const qs = params.toString();
  return useQuery({
    queryKey: ['ugc-category-insights', platform, createdDt],
    queryFn: () => v1Fetch(`/ugc/insights${qs ? `?${qs}` : ''}`),
  });
}

/**
 * UGC 콘텐츠 신규 등록
 * POST /api/contents/ugc
 */
export function useCreateUGCContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      v1Fetch('/ugc', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library', 'ugc'] });
    },
  });
}
