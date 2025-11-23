import { describe, it, expect, jest } from '@jest/globals';

// Mock WatermelonDB functions to return the config objects directly
jest.mock('@nozbe/watermelondb', () => ({
  appSchema: (config: any) => config,
  tableSchema: (config: any) => config,
}));

import { schema } from '../../src/model/schema';

// Define the expected fields for each entity based on shared types
// This serves as a runtime verification that our database schema supports our TypeScript interfaces
const EXPECTED_SCHEMA = {
  families: [
    'name',
    'kiosk_timeout_seconds',
    'created_at',
    'updated_at'
  ],
  users: [
    'family_id',
    'email',
    'name',
    'role',
    'pin_hash',
    'points_balance',
    'email_frequency',
    'avatar_url',
    'created_at',
    'updated_at'
  ],
  notifications: [
    'user_id',
    'title',
    'message',
    'type',
    'is_read',
    'created_at',
    'updated_at'
  ],
  tasks: [
    'family_id',
    'title',
    'description',
    'points',
    'status',
    'due_date',
    'recurrence_rule',
    'assignee_id',
    'creator_id',
    'created_at',
    'updated_at'
  ],
  events: [
    'family_id',
    'title',
    'start_time',
    'end_time',
    'recurrence_rule',
    'created_at',
    'updated_at'
  ],
  event_attendees: [
    'event_id',
    'user_id'
  ],
  meal_plans: [
    'family_id',
    'date',
    'meal_type',
    'description',
    'created_at',
    'updated_at'
  ],
  grocery_items: [
    'family_id',
    'name',
    'is_checked',
    'created_at',
    'updated_at'
  ],
  rewards: [
    'family_id',
    'title',
    'cost',
    'image_url',
    'created_at',
    'updated_at'
  ]
};

describe('Schema Consistency', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const tables = Array.isArray(schema.tables) ? schema.tables : Object.values(schema.tables);

  Object.entries(EXPECTED_SCHEMA).forEach(([tableName, expectedColumns]) => {
    it(`should have correct columns for table: ${tableName}`, () => {
      const table = tables.find((t: any) => t.name === tableName);
      expect(table).toBeDefined();

      const actualColumns = table.columns.map((c: any) => c.name);
      
      expectedColumns.forEach(column => {
        expect(actualColumns).toContain(column);
      });
    });
  });

  it('should not have any undefined tables in schema', () => {
    const definedTableNames = tables.map((t: any) => t.name);
    const expectedTableNames = Object.keys(EXPECTED_SCHEMA);
    
    expectedTableNames.forEach(name => {
      expect(definedTableNames).toContain(name);
    });
  });
});
