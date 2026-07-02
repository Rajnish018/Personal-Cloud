import { Server } from 'socket.io';

let io;

/**
 * Initialise Socket.IO with the given HTTP server.
 * This should be called once during server startup.
 */
export function initSocket(server) {
  if (io) return; // prevent re‑initialisation
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust in production to your client URL(s)
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(`user_${userId}`);
    }
    // optional: handle disconnects, etc.
  });
}

/**
 * Emit a notification event to a specific user.
 * @param {string} userId - Recipient user ObjectId.
 * @param {object} payload - Notification payload.
 */
export function emitNotification(userId, payload) {
  if (!io) return; // Socket not initialised yet
  io.to(`user_${userId}`).emit('notification:new', payload);
}

/**
 * Emit a generic event (read, deleted, etc.)
 */
export function emitNotificationEvent(userId, event, payload) {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, payload);
}
