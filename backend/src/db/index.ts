import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection string from environment
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/family_db';

// Create postgres client
export const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client);

// Export type for use in application
export type Database = typeof db;
