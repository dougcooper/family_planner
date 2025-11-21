import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Family, User, Notification } from './models';

// Initialize SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'family_dashboard',
  jsi: true, // Use JSI for better performance
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [Family, User, Notification],
});

export default database;
