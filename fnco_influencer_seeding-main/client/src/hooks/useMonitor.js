import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useMonitorDashboard(campaignId) {
  return useQuery({
    queryKey: ['monitor', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/monitor`),
    enabled: !!campaignId,
  });
}

export function usePDAHeatmap(campaignId) {
  return useQuery({
    queryKey: ['pda-heatmap', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/monitor/pda-heatmap`),
    enabled: !!campaignId,
  });
}

export function useFatigueReport(campaignId) {
  return useQuery({
    queryKey: ['fatigue', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/monitor/fatigue`),
    enabled: !!campaignId,
  });
}

export function useGenerateMockMetrics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/monitor/generate-mock`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['monitor', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['pda-heatmap', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['fatigue', campaignId] });
    },
  });
}
