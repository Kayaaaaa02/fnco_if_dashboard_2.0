import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useStrategy(campaignId) {
  return useQuery({
    queryKey: ['strategy', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/strategy`),
    enabled: !!campaignId,
  });
}

export function useStrategyHistory(campaignId) {
  return useQuery({
    queryKey: ['strategy-history', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/strategy/history`),
    enabled: !!campaignId,
  });
}

export function useGenerateStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, confirmed_concept_ids }) =>
      api.post(`/campaigns/${campaignId}/strategy/generate`, { confirmed_concept_ids }),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['strategy', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['strategy-history', campaignId] });
      // 전략 생성 시 서사 아크도 함께 생성되므로 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['narrative-arc', campaignId] });
      // 정합성 체크도 자동 실행되므로 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['alignment', campaignId] });
    },
  });
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, ...data }) =>
      api.put(`/campaigns/${campaignId}/strategy`, data),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['strategy', campaignId] });
    },
  });
}

export function useApproveStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/strategy/approve`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['strategy', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['strategy-history', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-hub', campaignId] });
    },
  });
}
