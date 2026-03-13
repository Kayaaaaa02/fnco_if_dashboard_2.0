import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api.js';

export function useAuditLog(campaignId, options = {}) {
  const { limit = 50, offset = 0, entity_type } = options;
  return useQuery({
    queryKey: ['audit', campaignId, { limit, offset, entity_type }],
    queryFn: () => api.get(`/campaigns/${campaignId}/audit`, { limit, offset, entity_type }),
    enabled: !!campaignId,
  });
}
