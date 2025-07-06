const { Server } = require('socket.io');
const logger = require('./utils/logger');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket.IO] User connected: ${socket.user.id}`);
    socket.join(`user_${socket.user.id}`);

    socket.on('disconnect', () => {
      logger.info(`[Socket.IO] User disconnected: ${socket.user.id}`);
    });
  });

  logger.info('[Socket.IO] Service initialized.');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
}

module.exports = { initSocket, getIO };
