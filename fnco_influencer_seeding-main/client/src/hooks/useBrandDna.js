import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useBrandDnaList() {
  return useQuery({
    queryKey: ['brand-dna'],
    queryFn: () => api.get('/brand-dna'),
  });
}

export function useCreateBrandDna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/brand-dna', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-dna'] }),
  });
}

export function useUpdateBrandDna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/brand-dna/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-dna'] }),
  });
}

export function useDeleteBrandDna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/brand-dna/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-dna'] }),
  });
}
