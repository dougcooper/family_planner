import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'families',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'kiosk_timeout_seconds', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'family_id', type: 'string', isIndexed: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'pin_hash', type: 'string' },
        { name: 'points_balance', type: 'number' },
        { name: 'email_frequency', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'is_read', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'family_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'points', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'recurrence_rule', type: 'string', isOptional: true },
        { name: 'assignee_id', type: 'string', isIndexed: true },
        { name: 'creator_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'events',
      columns: [
        { name: 'family_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number' },
        { name: 'recurrence_rule', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'event_attendees',
      columns: [
        { name: 'event_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'meal_plans',
      columns: [
        { name: 'family_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'string' },
        { name: 'meal_type', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'grocery_items',
      columns: [
        { name: 'family_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'is_checked', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'rewards',
      columns: [
        { name: 'family_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'cost', type: 'number' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

