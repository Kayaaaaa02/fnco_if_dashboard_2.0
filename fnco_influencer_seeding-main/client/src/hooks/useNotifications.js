import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useNotifications(userId = 'system') {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => api.get('/notifications', { user_id: userId }),
    refetchInterval: 30000, // 30s polling
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId = 'system') =>
      api.request('PATCH', `/notifications/read-all`, { params: { user_id: userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
