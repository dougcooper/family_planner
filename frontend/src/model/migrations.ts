import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 7,
      steps: [
        addColumns({
          table: 'list_items',
          columns: [
            { name: 'assignee_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        createTable({
          name: 'meal_labels',
          columns: [
            { name: 'family_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'sort_order', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        addColumns({
          table: 'meal_plans',
          columns: [
            { name: 'meal_label_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'meal_plans',
          columns: [
            { name: 'recipe_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        createTable({
          name: 'recipes',
          columns: [
            { name: 'family_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'ingredients', type: 'string' },
            { name: 'instructions', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
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
        addColumns({
          table: 'events',
          columns: [
            { name: 'recurrence_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'is_all_day', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'lists',
          columns: [
            { name: 'family_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'list_items',
          columns: [
            { name: 'list_id', type: 'string', isIndexed: true },
            { name: 'text', type: 'string' },
            { name: 'is_checked', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
