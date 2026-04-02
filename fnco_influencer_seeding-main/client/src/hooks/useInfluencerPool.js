import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';
import { normalizeBrandCollab, normalizeCollaborator } from '@/components/influencer-pool/normalizer.js';
import {
    fetchCompletedData,
    fetchAnalysisStatuses,
    requestDeepAnalysis,
    fetchDeepAnalysisResult,
} from '@/components/influencer-pool/deepAnalysisMock.js';

// ─── V1 Legacy Hooks (기존 유지 — AnalyticsPage, CreatorHub, CreatorDeepAnalysis 등에서 사용) ───

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

export function useInfluencerDeepAnalysis(profileId) {
  return useQuery({
    queryKey: ['influencer-pool', 'deep-analysis', profileId],
    queryFn: () => v1Fetch(`/deep-analysis/${profileId}`),
    enabled: !!profileId,
  });
}

export function useRegisterInfluencerExcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${V1_BASE}/register-excel`, {
        method: 'POST',
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
          throw new Error(err.error || err.message || 'Upload failed');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-pool'] });
    },
  });
}

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

// ─── V2 Hooks (인플루언서 풀 신규 디자인용) ───

/**
 * 타브랜드 인플루언서 (제외 인원)
 */
export function useBrandCollabs() {
    return useQuery({
        queryKey: ['influencer-pool', 'brand-collabs'],
        queryFn: async () => {
            const data = await api.get('/influencer-pool/brand-collabs');
            const influencers = (data.influencers || []).map(normalizeBrandCollab);
            return { influencers };
        },
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * FNCO 인플루언서 (FNCO 크리에이터)
 */
export function useCollaborators() {
    return useQuery({
        queryKey: ['influencer-pool', 'collaborators'],
        queryFn: async () => {
            const data = await api.get('/influencer-pool/collaborators', {
                page: 1,
                pageSize: 100,
            });
            const influencers = (data.collaborators || []).map(normalizeCollaborator);
            return { influencers };
        },
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * 허브 대상 확정 인원 수 조회
 */
export function useConfirmedCount() {
    return useQuery({
        queryKey: ['influencer-pool', 'confirmed-count'],
        queryFn: async () => {
            const data = await api.get('/influencer-pool/confirmed/count');
            return data.count || 0;
        },
    });
}

/**
 * 허브 대상 확정 인원 목록 조회
 */
export function useConfirmedInfluencers() {
    return useQuery({
        queryKey: ['influencer-pool', 'confirmed'],
        queryFn: async () => {
            const data = await api.get('/influencer-pool/confirmed');
            return data.influencers || [];
        },
    });
}

/**
 * 허브 대상 확정 mutation
 */
export function useConfirmHubTargets() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ influencers, created_by }) =>
            api.post('/influencer-pool/confirm', { influencers, created_by }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['influencer-pool', 'confirmed-count'] });
            queryClient.invalidateQueries({ queryKey: ['influencer-pool', 'confirmed'] });
        },
    });
}

/**
 * 허브 대상 확정 취소 mutation (단건)
 */
export function useCancelHubTarget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ profileId, platform, updated_by }) =>
            api.patch(`/influencer-pool/confirm/${profileId}`, {
                platform,
                is_selected: false,
                updated_by,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['influencer-pool', 'confirmed-count'] });
            queryClient.invalidateQueries({ queryKey: ['influencer-pool', 'confirmed'] });
        },
    });
}

/**
 * 허브 대상 벌크 취소 mutation
 */
export function useCancelHubTargets() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ profileIds, updated_by }) =>
            api.post('/influencer-pool/cancel', { profileIds, updated_by }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['influencer-pool', 'confirmed-count'] });
            queryClient.invalidateQueries({ queryKey: ['influencer-pool', 'confirmed'] });
        },
    });
}

// ─── 심층 분석 ───

/**
 * 분석 완료 데이터 조회 (completedIds Set + statsMap)
 */
export function useCompletedAnalysisData() {
    return useQuery({
        queryKey: ['influencer-pool', 'deep-analysis', 'completed'],
        queryFn: fetchCompletedData,
        staleTime: 30 * 1000,
        select: (data) => ({
            completedIds: new Set(data.completedIds),
            processingIds: new Set(data.processingIds),
            statsMap: data.statsMap,
        }),
    });
}

/**
 * 심층 분석 요청 mutation
 */
export function useRequestDeepAnalysis() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: requestDeepAnalysis,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['influencer-pool', 'deep-analysis', 'completed'] });
        },
    });
}

/**
 * 진행 중인 분석 상태 폴링
 */
export function usePollingAnalysisStatus(processingIds, onCompleted) {
    const intervalRef = useRef(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!processingIds || processingIds.length === 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(async () => {
            try {
                const statuses = await fetchAnalysisStatuses(processingIds);
                const completed = [];
                for (const [id, status] of Object.entries(statuses)) {
                    if (status === 'completed' || status === 'failed') {
                        completed.push({ id, status });
                    }
                }
                if (completed.length > 0) {
                    onCompleted?.(completed);
                    queryClient.invalidateQueries({ queryKey: ['influencer-pool', 'deep-analysis', 'completed'] });
                }
            } catch (e) {
                console.error('[DeepAnalysis] 폴링 실패:', e.message);
            }
        }, 5000);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [processingIds, onCompleted, queryClient]);
}

/**
 * 분석 결과 조회
 */
export function useDeepAnalysisResult(profileId, platform, enabled = false) {
    return useQuery({
        queryKey: ['influencer-pool', 'deep-analysis', profileId],
        queryFn: () => fetchDeepAnalysisResult(profileId, platform),
        enabled: !!profileId && enabled,
        staleTime: 5 * 60 * 1000,
    });
}
