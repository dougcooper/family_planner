import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../logger.js';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  try {
    logger.info('⏳ Running migrations...');
    
    // Resolve path to drizzle folder relative to this file
    // src/db/migrate.ts -> ../../drizzle
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    
    await migrate(db, { migrationsFolder });
    logger.info('✅ Migrations completed successfully');
  } catch (error) {
    logger.error({ err: error }, '❌ Migration failed');
    // Don't exit process here, let the caller decide or just log it
    // For critical DB changes, we might want to throw
    throw error;
  }
}
