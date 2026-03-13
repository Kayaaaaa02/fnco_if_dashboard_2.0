import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useUGCContent(campaignId) {
  return useQuery({
    queryKey: ['ugc-content', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/ugc-flywheel/content`),
    enabled: !!campaignId,
  });
}

export function useUGCCreators(campaignId) {
  return useQuery({
    queryKey: ['ugc-creators', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/ugc-flywheel/creators`),
    enabled: !!campaignId,
  });
}

export function useHarvestUGC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/ugc-flywheel/content/harvest`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['ugc-content', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['ugc-creators', campaignId] });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, ugcId, permission_status }) =>
      api.patch(`/campaigns/${campaignId}/ugc-flywheel/content/${ugcId}/permission`, { permission_status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ugc-content', variables.campaignId] });
    },
  });
}

export function useUpdateAmplify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, ugcId, amplify_status }) =>
      api.patch(`/campaigns/${campaignId}/ugc-flywheel/content/${ugcId}/amplify`, { amplify_status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ugc-content', variables.campaignId] });
    },
  });
}

export function useConvertCreator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, creatorId }) =>
      api.post(`/campaigns/${campaignId}/ugc-flywheel/creators/${creatorId}/convert`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ugc-creators', variables.campaignId] });
    },
  });
}
