import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 4,
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
        { name: 'recurrence_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'is_all_day', type: 'boolean' },
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
      name: 'lists',
      columns: [
        { name: 'family_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'list_items',
      columns: [
        { name: 'list_id', type: 'string', isIndexed: true },
        { name: 'text', type: 'string' },
        { name: 'is_checked', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'recipes',
      columns: [
        { name: 'family_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'ingredients', type: 'string' }, // JSON array
        { name: 'instructions', type: 'string', isOptional: true },
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
    tableSchema({
      name: 'reward_claims',
      columns: [
        { name: 'reward_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'points_cost', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'claimed_at', type: 'number' },
        { name: 'unclaimed_at', type: 'number', isOptional: true },
        { name: 'unclaimed_by', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

