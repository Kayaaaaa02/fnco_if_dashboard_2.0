import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useCreatives(campaignId) {
  return useQuery({
    queryKey: ['creatives', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/creatives`),
    enabled: !!campaignId,
  });
}

export function useCreative(campaignId, creativeId) {
  return useQuery({
    queryKey: ['creative', creativeId],
    queryFn: () => api.get(`/campaigns/${campaignId}/creatives/${creativeId}`),
    enabled: !!campaignId && !!creativeId,
  });
}

export function useGenerateCreatives() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, conceptIds }) =>
      api.post(`/campaigns/${campaignId}/creatives/generate`, conceptIds ? { conceptIds } : {}),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['creatives', campaignId] });
    },
  });
}

export function useUpdateCreative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, creativeId, ...data }) =>
      api.put(`/campaigns/${campaignId}/creatives/${creativeId}`, data),
    onSuccess: (_, { campaignId, creativeId }) => {
      queryClient.invalidateQueries({ queryKey: ['creatives', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['creative', creativeId] });
    },
  });
}

export function useGenerateImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, creativeId }) =>
      api.post(`/campaigns/${campaignId}/creatives/${creativeId}/images/generate`),
    onSuccess: (_, { campaignId, creativeId }) => {
      queryClient.invalidateQueries({ queryKey: ['creative', creativeId] });
      queryClient.invalidateQueries({ queryKey: ['creatives', campaignId] });
    },
  });
}

export function useSelectImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, creativeId, selectedImages }) =>
      api.patch(`/campaigns/${campaignId}/creatives/${creativeId}/images/select`, { selectedImages }),
    onSuccess: (_, { campaignId, creativeId }) => {
      queryClient.invalidateQueries({ queryKey: ['creative', creativeId] });
      queryClient.invalidateQueries({ queryKey: ['creatives', campaignId] });
    },
  });
}

export function useGenerateGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, creativeId, conceptId }) => {
      const cId = String(creativeId).startsWith('concept-') ? 'auto' : creativeId;
      return api.post(`/campaigns/${campaignId}/creatives/${cId}/guide/generate`, conceptId ? { conceptId } : {});
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['creatives', campaignId] });
    },
  });
}

export function useBulkUpdateCreativeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, creativeIds, status }) => {
      const results = await Promise.allSettled(
        creativeIds.map((creativeId) =>
          api.put(`/campaigns/${campaignId}/creatives/${creativeId}`, { status })
        )
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      return { updated: succeeded, total: creativeIds.length };
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['creatives', campaignId] });
    },
  });
}
