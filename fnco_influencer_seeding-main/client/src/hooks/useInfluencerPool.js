import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// V1 API base (no /v2 prefix) — direct fetch since ApiClient uses /api/v2
const V1_BASE = '/api/influencer';

async function v1Fetch(path, options = {}) {
  const url = `${V1_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch influencer pool list + count
 * GET /api/influencer/list[?selected_only=true]  — returns { success, list }
 * GET /api/influencer/count[?selected_only=true] — returns { success, count }
 */
export function useInfluencerPool(options = {}) {
  const selectedOnly = options.selectedOnly === true;
  const queryString = selectedOnly ? '?selected_only=true' : '';

  const listQuery = useQuery({
    queryKey: ['influencer-pool', 'list', { selectedOnly }],
    queryFn: () => v1Fetch(`/list${queryString}`),
  });

  const countQuery = useQuery({
    queryKey: ['influencer-pool', 'count', { selectedOnly }],
    queryFn: () => v1Fetch(`/count${queryString}`),
  });

  const partneredQuery = useQuery({
    queryKey: ['influencer-pool', 'partnered-count'],
    queryFn: () => v1Fetch('/partnered-count'),
  });

  return {
    influencers: listQuery.data?.list ?? [],
    count: countQuery.data?.count ?? 0,
    partneredCount: partneredQuery.data?.count ?? 0,
    isLoading: listQuery.isLoading || countQuery.isLoading,
    isError: listQuery.isError || countQuery.isError,
    error: listQuery.error || countQuery.error,
    refetch: () => {
      listQuery.refetch();
      countQuery.refetch();
      partneredQuery.refetch();
    },
  };
}

/**
 * Deep analysis mutation
 * POST /api/influencer/deep-analysis
 * body: { influencers: [{ profile_id, platform }], language }
 */
export function useInfluencerAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ influencers, language = 'ko', plan_doc_id = null }) =>
      v1Fetch('/deep-analysis', {
        method: 'POST',
        body: JSON.stringify({ plan_doc_id, influencers, language }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-pool'] });
    },
  });
}

/**
 * Quick analysis mutation
 * POST /api/influencer/analyze
 * body: { profile_url: string[], user_nm?: string }
 */
export function useQuickAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profile_url, user_nm }) =>
      v1Fetch('/analyze', {
        method: 'POST',
        body: JSON.stringify({ profile_url, user_nm }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-pool'] });
    },
  });
}

/**
 * 인플루언서 심층 분석 데이터 조회
 * GET /api/influencer/deep-analysis/:profileId
 */
export function useInfluencerDeepAnalysis(profileId) {
  return useQuery({
    queryKey: ['influencer-pool', 'deep-analysis', profileId],
    queryFn: () => v1Fetch(`/deep-analysis/${profileId}`),
    enabled: !!profileId,
  });
}

/**
 * Toggle influencer selection (mark/unmark)
 * POST /api/influencer/mark-selected   — body: { profile_ids, updated_by }
 * POST /api/influencer/unmark-selected — body: { profile_ids, updated_by }
 */
export function useToggleInfluencerSelection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileIds, selected, updatedBy = null }) => {
      const endpoint = selected ? '/mark-selected' : '/unmark-selected';
      return v1Fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ profile_ids: profileIds, updated_by: updatedBy }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-pool'] });
    },
  });
}
