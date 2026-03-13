import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useCalendar(campaignId) {
  return useQuery({
    queryKey: ['calendar', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/calendar`),
    enabled: !!campaignId,
  });
}

export function useGenerateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId) => api.post(`/campaigns/${campaignId}/calendar/generate`),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['calendar', campaignId] });
    },
  });
}

export function useUpdateCalendarItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, calendarId, ...data }) =>
      api.put(`/campaigns/${campaignId}/calendar/${calendarId}`, data),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['calendar', campaignId] });
    },
  });
}
