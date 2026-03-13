import { io } from 'socket.io-client';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// DEMO_MODE용 no-op 소켓 프록시
const noopSocket = {
  on: () => {},
  off: () => {},
  emit: () => {},
  connected: false,
  id: 'demo-noop',
};

let socket = null;

export function initSocket() {
  if (DEMO_MODE) return noopSocket;
  if (socket) return socket;

  const url = import.meta.env.VITE_WS_URL || window.location.origin;

  socket = io(url, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[Socket.IO] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket.IO] Connection error:', error.message);
  });

  return socket;
}

export function getSocket() {
  if (DEMO_MODE) return noopSocket;
  return socket || initSocket();
}

export function joinCampaign(campaignId) {
  const s = getSocket();
  s.emit('join:campaign', campaignId);
}

export function leaveCampaign(campaignId) {
  const s = getSocket();
  s.emit('leave:campaign', campaignId);
}
