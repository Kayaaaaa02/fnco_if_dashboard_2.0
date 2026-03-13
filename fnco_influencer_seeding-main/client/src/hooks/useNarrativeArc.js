import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useNarrativeArc(campaignId) {
  return useQuery({
    queryKey: ['narrative-arc', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/narrative-arc`),
    enabled: !!campaignId,
  });
}

export function useGenerateNarrativeArc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) =>
      api.post(`/campaigns/${campaignId}/narrative-arc/generate`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['narrative-arc', campaignId] });
    },
  });
}

export function useUpdateNarrativeArc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, phases }) =>
      api.put(`/campaigns/${campaignId}/narrative-arc`, { phases }),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['narrative-arc', campaignId] });
    },
  });
}
