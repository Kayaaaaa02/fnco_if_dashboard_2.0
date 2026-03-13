import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useEarlySignals(campaignId) {
  return useQuery({
    queryKey: ['early-signals', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/signals`),
    enabled: !!campaignId,
  });
}

export function useDetectSignals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/signals/detect`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['early-signals', campaignId] });
    },
  });
}
