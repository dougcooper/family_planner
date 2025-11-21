import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// CORS configuration for frontend
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
});

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok', version: '1.0.0' };
});

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
