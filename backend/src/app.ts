import Fastify from 'fastify';
import cors from '@fastify/cors';
import { register } from './api/auth/register.js';
import { login } from './api/auth/login.js';
import { pullChanges, SyncPullQuery } from './sync/pull.js';
import { pushChanges, SyncPushBody } from './sync/push.js';
import { authenticate } from './middleware/auth.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// CORS configuration for frontend
await app.register(cors, {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'http://localhost:8081'
  ],
  credentials: true,
});

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok', version: '1.0.0' };
});

// Auth routes
app.post('/auth/register', register);
app.post('/auth/login', login);

// Sync routes (protected)
app.get<{ Querystring: SyncPullQuery }>('/sync/pull', { preHandler: authenticate }, pullChanges);
app.post<{ Body: SyncPushBody }>('/sync/push', { preHandler: authenticate }, pushChanges);

// Server startup
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Backend server ready at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
