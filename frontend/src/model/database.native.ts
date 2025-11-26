import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import { v4 as uuidv4 } from 'uuid';
import { schema } from './schema';
import migrations from './migrations';
import { Family, User, Notification, Task, Event, EventAttendee, MealPlan, GroceryItem, Reward, RewardClaim, List, ListItem, Recipe, MealLabel } from './models';
import log from '../utils/logger';

// Use UUIDs for all IDs to match backend requirements
setGenerator(() => {
  const id = uuidv4();
  return id;
});

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'family_dashboard',
  jsi: true,
  onSetUpError: (error) => {
    log.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Family, User, Notification, Task, Event, EventAttendee, MealPlan, GroceryItem, Reward, RewardClaim, List, ListItem, Recipe, MealLabel],
});

export default database;
