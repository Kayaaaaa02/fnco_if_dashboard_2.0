import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useChannelSetup(campaignId) {
  return useQuery({
    queryKey: ['channel-setup', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/channel-setup`),
    enabled: !!campaignId,
  });
}

export function useGenerateChannelSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) =>
      api.post(`/campaigns/${campaignId}/channel-setup/generate`),
    onSuccess: (_data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['channel-setup', campaignId] });
    },
  });
}

export function useUpdateChannelSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, setupId, data }) =>
      api.put(`/campaigns/${campaignId}/channel-setup/${setupId}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel-setup', variables.campaignId] });
    },
  });
}

export function useDeleteChannelSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, setupId }) =>
      api.delete(`/campaigns/${campaignId}/channel-setup/${setupId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel-setup', variables.campaignId] });
    },
  });
}
