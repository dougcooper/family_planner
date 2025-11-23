import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { register } from './api/auth/register.js';
import { login } from './api/auth/login.js';
import { uploadFile } from './api/upload.js';
import { pullChanges, SyncPullQuery } from './sync/pull.js';
import { pushChanges, SyncPushBody } from './sync/push.js';
import { authenticate } from './middleware/auth.js';
import { runMigrations } from './db/migrate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register multipart support
app.register(multipart);

// Register static file serving for uploads
app.register(fastifyStatic, {
  root: join(__dirname, '..', 'uploads'),
  prefix: '/uploads/', // optional: default '/'
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

// Upload route (protected)
app.post('/upload', { preHandler: authenticate }, uploadFile);

// Sync routes (protected)
app.get<{ Querystring: SyncPullQuery }>('/sync/pull', { preHandler: authenticate }, pullChanges);
app.post<{ Body: SyncPushBody }>('/sync/push', { preHandler: authenticate }, pushChanges);

// Server startup
const start = async () => {
  try {
    // Run database migrations
    await runMigrations();

    const port = parseInt(process.env.PORT || '3000', 10);
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Backend server ready at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
