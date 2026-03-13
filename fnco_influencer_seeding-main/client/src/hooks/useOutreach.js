import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useOutreach(campaignId) {
  return useQuery({
    queryKey: ['outreach', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/outreach`),
    enabled: !!campaignId,
  });
}

export function useGenerateOutreach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/outreach/generate`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['outreach', campaignId] });
    },
  });
}

export function useUpdateOutreach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, outreachId, ...data }) =>
      api.put(`/campaigns/${campaignId}/outreach/${outreachId}`, data),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['outreach', campaignId] });
    },
  });
}

export function useSendOutreach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, outreachId }) =>
      api.post(`/campaigns/${campaignId}/outreach/${outreachId}/send`),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['outreach', campaignId] });
    },
  });
}

export function useBulkSendOutreach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, outreachIds }) => {
      const results = await Promise.allSettled(
        outreachIds.map((outreachId) =>
          api.post(`/campaigns/${campaignId}/outreach/${outreachId}/send`)
        )
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      return { sent: succeeded, total: outreachIds.length };
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['outreach', campaignId] });
    },
  });
}

export function useBulkDeleteOutreach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, outreachIds }) => {
      const results = await Promise.allSettled(
        outreachIds.map((outreachId) =>
          api.delete(`/campaigns/${campaignId}/outreach/${outreachId}`)
        )
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      return { deleted: succeeded, total: outreachIds.length };
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['outreach', campaignId] });
    },
  });
}
