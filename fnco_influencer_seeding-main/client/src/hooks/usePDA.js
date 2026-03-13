import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function usePDA(campaignId) {
  return useQuery({
    queryKey: ['pda', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/pda`),
    enabled: !!campaignId,
  });
}

export function useGeneratePDA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/pda/generate`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['pda', campaignId] });
      // PDA 생성 시 제품 분석도 brand_dna에 저장되므로 캠페인 데이터 리프레시
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-hub', campaignId] });
    },
  });
}

export function useUpdatePersonas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, personas }) =>
      api.put(`/campaigns/${campaignId}/pda/personas`, { personas }),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['pda', campaignId] });
    },
  });
}

export function useUpdateDesires() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, desires }) =>
      api.put(`/campaigns/${campaignId}/pda/desires`, { desires }),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['pda', campaignId] });
    },
  });
}

export function useUpdateConcepts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, concepts }) =>
      api.put(`/campaigns/${campaignId}/pda/concepts`, { concepts }),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['pda', campaignId] });
    },
  });
}

export function useUpdateConceptStatuses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, concept_ids, status }) =>
      api.patch(`/campaigns/${campaignId}/pda/concepts/status`, { concept_ids, status }),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['pda', campaignId] });
    },
  });
}

export function useGenerateConcepts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/pda/concepts/generate`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['pda', campaignId] });
    },
  });
}
