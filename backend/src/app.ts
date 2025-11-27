import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyCron from 'fastify-cron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { register } from './api/auth/register.js';
import { login } from './api/auth/login.js';
import { uploadFile, deleteFile } from './api/upload.js';
import { pullChanges, SyncPullQuery } from './sync/pull.js';
import { pushChanges, SyncPushBody } from './sync/push.js';
import { authenticate } from './middleware/auth.js';
import { runMigrations } from './db/migrate.js';
import { processRecurringEventsTopUp } from './services/recurring-events.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// CORS configuration for frontend
await app.register(cors, {
  origin: true, // Allow all origins (reflects request origin)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Register multipart support
app.register(multipart);

// Register static file serving for uploads
app.register(fastifyStatic, {
  root: join(__dirname, '..', 'uploads'),
  prefix: '/uploads/', // optional: default '/'
});

// Register cron jobs
app.register(fastifyCron, {
  jobs: [
    {
      cronTime: '0 2 * * *', // Run every day at 2:00 AM
      onTick: async () => {
        app.log.info('Running nightly recurring events top-up job...');
        try {
          const result = await processRecurringEventsTopUp();
          app.log.info({ result }, 'Nightly top-up job completed');
        } catch (err) {
          app.log.error({ err }, 'Nightly top-up job failed');
        }
      },
      start: true
    }
  ]
});

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok', version: '1.0.0' };
});

// Maintenance endpoint to trigger recurring events top-up manually
app.post('/jobs/recurring-top-up', async (_request, _reply) => {
  // Ideally protect this with an admin secret
  const result = await processRecurringEventsTopUp();
  return result;
});

// Auth routes
app.post('/auth/register', register);
app.post('/auth/login', login);

// Upload route (protected)
app.post('/upload', { preHandler: authenticate }, uploadFile);
app.delete('/upload', { preHandler: authenticate }, deleteFile);

// Sync routes (protected)
app.get<{ Querystring: SyncPullQuery }>('/sync/pull', { preHandler: authenticate }, pullChanges);
app.post<{ Body: SyncPushBody }>('/sync/push', { preHandler: authenticate }, pushChanges);

// Server startup
const start = async () => {
  try {
    // Run database migrations
    await runMigrations();
    await app.listen({ port: 3000, host: '0.0.0.0' });
    
    // Run once on startup after a short delay to ensure DB is ready
    // This is useful for development/testing to ensure logic runs immediately
    // but in production we rely on the cron job
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(() => {
        app.log.info('Running startup recurring events top-up check...');
        processRecurringEventsTopUp().catch(err => app.log.error(err));
      }, 5000);
    }

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
