import { Server } from 'socket.io';

let io = null;

export function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);

    // Join campaign room
    socket.on('join:campaign', (campaignId) => {
      socket.join(`campaign:${campaignId}`);
      console.log(`[Socket.IO] ${socket.id} joined campaign:${campaignId}`);
    });

    // Leave campaign room
    socket.on('leave:campaign', (campaignId) => {
      socket.leave(`campaign:${campaignId}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

// Emit to all clients in a campaign room
export function emitToCampaign(campaignId, event, data) {
  if (io) {
    io.to(`campaign:${campaignId}`).emit(event, data);
  }
}

// Emit to all connected clients
export function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}
