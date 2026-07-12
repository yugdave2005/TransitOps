const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./env');

let io = null;

function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow local frontend connections
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        // Allow public/anonymous socket or treat as guest if needed, but here we can decode if token exists
        socket.user = { role: 'GUEST' };
        return next();
      }
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      // Don't reject connection harshly in dev if token expired, just set guest
      socket.user = { role: 'GUEST' };
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id} (Role: ${socket.user?.role || 'Unknown'})`);

    socket.on('join_room', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket.io] Server initialized.');
  return io;
}

function getIo() {
  return io || null;
}

function emitToAll(event, payload) {
  if (io) {
    io.emit(event, payload);
  }
}

module.exports = {
  initSocketServer,
  getIo,
  getIO: getIo,
  emitToAll
};
