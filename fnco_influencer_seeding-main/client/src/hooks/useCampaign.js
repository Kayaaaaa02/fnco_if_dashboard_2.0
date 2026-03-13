import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useCampaigns(filters = {}) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => api.get('/campaigns', filters),
  });
}

export function useCampaign(campaignId) {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}`),
    enabled: !!campaignId,
  });
}

export function useCampaignHub(campaignId) {
  return useQuery({
    queryKey: ['campaign-hub', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/hub`),
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      // FormData인 경우 upload 메서드 사용 (파일 포함)
      if (data instanceof FormData) {
        return api.upload('/campaigns', data);
      }
      return api.post('/campaigns', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/campaigns/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
    },
  });
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
