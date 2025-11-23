import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import { v4 as uuidv4 } from 'uuid';
import { schema } from './schema';
import { Family, User, Notification, Task, Event, EventAttendee, MealPlan, GroceryItem, Reward } from './models';

// Use UUIDs for all IDs to match backend requirements
setGenerator(() => {
  const id = uuidv4();
  return id;
});

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  dbName: 'family_dashboard', // Ensure consistent DB name for persistence
  onSetUpError: (error: Error) => {
    // eslint-disable-next-line no-console
    console.error('Database setup error:', error);
  },
  extraLokiOptions: {
    autosave: true,
    autosaveInterval: 500,
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Family, User, Notification, Task, Event, EventAttendee, MealPlan, GroceryItem, Reward],
});

export default database;
