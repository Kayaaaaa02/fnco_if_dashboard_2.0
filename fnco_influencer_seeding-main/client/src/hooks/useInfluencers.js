import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useCampaignInfluencers(campaignId) {
  return useQuery({
    queryKey: ['campaign-influencers', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/influencers`),
    enabled: !!campaignId,
  });
}

export function useMatchInfluencers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/influencers/match`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-influencers', campaignId] });
    },
  });
}

export function useUpdateInfluencerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, profileId, status }) =>
      api.patch(`/campaigns/${campaignId}/influencers/${profileId}`, { status }),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-influencers', campaignId] });
    },
  });
}

export function useDeepAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, profileId }) =>
      api.post(`/campaigns/${campaignId}/influencers/${profileId}/deep-analysis`),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-influencers', campaignId] });
    },
  });
}

export function useBulkUpdateInfluencers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, ids, action, data }) =>
      api.patch(`/campaigns/${campaignId}/influencers/bulk`, { ids, action, data }),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-influencers', campaignId] });
    },
  });
}
