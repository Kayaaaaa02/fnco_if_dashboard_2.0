import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useAlignment(campaignId) {
  return useQuery({
    queryKey: ['alignment', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/alignment`),
    enabled: !!campaignId,
  });
}

export function useRunAlignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/alignment/run`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['alignment', campaignId] });
    },
  });
}
