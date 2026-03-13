import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, joinCampaign, leaveCampaign } from '@/lib/socket';

// Listen to socket events and invalidate TanStack Query cache
export function useCampaignSocket(campaignId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    joinCampaign(campaignId);
    const socket = getSocket();

    // Phase status change
    const handlePhaseChange = () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-hub', campaignId] });
    };

    // Data change events — invalidate relevant queries
    const handleDataChange = (data) => {
      const { entity } = data;
      if (entity) {
        queryClient.invalidateQueries({ queryKey: [entity, campaignId] });
      }
    };

    // AI generation complete
    const handleAIComplete = (data) => {
      const { entity } = data;
      if (entity) {
        queryClient.invalidateQueries({ queryKey: [entity, campaignId] });
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    // Notification
    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('phase:change', handlePhaseChange);
    socket.on('data:change', handleDataChange);
    socket.on('ai:complete', handleAIComplete);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('phase:change', handlePhaseChange);
      socket.off('data:change', handleDataChange);
      socket.off('ai:complete', handleAIComplete);
      socket.off('notification', handleNotification);
      leaveCampaign(campaignId);
    };
  }, [campaignId, queryClient]);
}

// Global socket events (not campaign-specific)
export function useGlobalSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    const handleCampaignUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    };

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('campaign:update', handleCampaignUpdate);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('campaign:update', handleCampaignUpdate);
      socket.off('notification', handleNotification);
    };
  }, [queryClient]);
}
