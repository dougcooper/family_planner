import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
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
