import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useOptimizations(campaignId) {
  return useQuery({
    queryKey: ['optimizations', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/optimization`),
    enabled: !!campaignId,
  });
}

export function useGenerateOptimizations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/optimization/generate`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['optimizations', campaignId] });
    },
  });
}

export function useApplyOptimization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, actionId, status, applied_by }) =>
      api.patch(`/campaigns/${campaignId}/optimization/${actionId}`, { status, applied_by }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['optimizations', variables.campaignId] });
    },
  });
}
