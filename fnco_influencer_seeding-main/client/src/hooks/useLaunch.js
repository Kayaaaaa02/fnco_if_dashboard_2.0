import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useLaunchSchedule(campaignId) {
  return useQuery({
    queryKey: ['launch', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/launch`),
    enabled: !!campaignId,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, ...data }) =>
      api.post(`/campaigns/${campaignId}/launch/schedule`, data),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['launch', campaignId] });
    },
  });
}

export function useApproveLaunch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/launch/approve`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['launch', campaignId] });
    },
  });
}

export function useExecuteLaunch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/launch/execute`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['launch', campaignId] });
    },
  });
}
