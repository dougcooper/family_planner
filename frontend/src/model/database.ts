import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import { v4 as uuidv4 } from 'uuid';
import { schema } from './schema';
import { Family, User, Notification, Task, Event, EventAttendee, MealPlan, GroceryItem, Reward } from './models';

// Use UUIDs for all IDs to match backend requirements
setGenerator(() => {
  const id = uuidv4();
  console.log('Generated UUID:', id);
  return id;
});

let adapter;

if (Platform.OS === 'web') {
  adapter = new LokiJSAdapter({
    dbName: 'family_planner_db', // Explicit name to ensure we start fresh and avoid old corrupted data
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    onSetUpError: (error: Error) => {
      console.error('Database setup error:', error);
    },
  });
} else {
  // Initialize SQLite adapter
  adapter = new SQLiteAdapter({
    schema,
    dbName: 'family_dashboard',
    jsi: true, // Use JSI for better performance
    onSetUpError: (error) => {
      console.error('Database setup error:', error);
    },
  });
}

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [Family, User, Notification, Task, Event, EventAttendee, MealPlan, GroceryItem, Reward],
});

export default database;
