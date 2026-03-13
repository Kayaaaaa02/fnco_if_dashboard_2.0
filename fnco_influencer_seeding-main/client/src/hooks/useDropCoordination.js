import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useDrops(campaignId) {
  return useQuery({
    queryKey: ['drops', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/drops`),
    enabled: !!campaignId,
  });
}

export function useGenerateDrops() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) =>
      api.post(`/campaigns/${campaignId}/drops/generate`),
    onSuccess: (_data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['drops', campaignId] });
    },
  });
}

export function useUpdateDrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, dropId, data }) =>
      api.put(`/campaigns/${campaignId}/drops/${dropId}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['drops', variables.campaignId] });
    },
  });
}

export function useSendReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) =>
      api.post(`/campaigns/${campaignId}/drops/send-reminders`),
    onSuccess: (_data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['drops', campaignId] });
    },
  });
}
