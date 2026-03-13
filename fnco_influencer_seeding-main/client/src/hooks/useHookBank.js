import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useHookBank(campaignId, filters = {}) {
  const params = {};
  if (filters.phase) params.phase = filters.phase;
  if (filters.type) params.type = filters.type;

  return useQuery({
    queryKey: ['hookBank', campaignId, filters],
    queryFn: () => api.get(`/campaigns/${campaignId}/hook-bank`, params),
    enabled: !!campaignId,
  });
}

export function useGenerateHooks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/hook-bank/generate`),
    onSuccess: (_data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['hookBank', campaignId] });
    },
  });
}

export function useUpdateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, hookId, data }) =>
      api.put(`/campaigns/${campaignId}/hook-bank/${hookId}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hookBank', variables.campaignId] });
    },
  });
}

export function useDeleteHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, hookId }) =>
      api.delete(`/campaigns/${campaignId}/hook-bank/${hookId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hookBank', variables.campaignId] });
    },
  });
}
