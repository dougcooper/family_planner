import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
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
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'events',
          columns: [
            { name: 'recurrence_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'is_all_day', type: 'boolean' },
          ],
        }),
      ],
    },
  ],
});
