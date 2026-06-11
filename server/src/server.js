import http from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  await connectDatabase(env.mongoUri);

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    socket.emit('connected', { socketId: socket.id });
  });

  server.listen(env.port, () => {
    logger.info('API server started', { port: env.port });
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});
