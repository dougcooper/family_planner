/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

// Mock schema creators
jest.mock('@nozbe/watermelondb', () => {
  const actual = jest.requireActual('@nozbe/watermelondb') as any;
  if (actual.appSchema) {
      return actual;
  }
  return {
    ...actual,
    appSchema: (config: any) => ({ ...config, version: config.version || 1 }),
    tableSchema: (config: any) => config,
  };
});

import { schema } from '../../src/model/schema';
import { List, ListItem } from '../../src/model/models';

describe('List Visibility Logic', () => {
  let database: Database;

  beforeEach(async () => {
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      dbName: 'test-list-visibility-' + Math.random(),
      extraLokiOptions: {
        autosave: false,
      },
    });
    database = new Database({
      adapter,
      modelClasses: [List, ListItem],
    });
  });

  it('should filter out completed items when showCompleted is false', async () => {
    // Create a list
    const list = await database.write(async () => {
      return await database.get<List>('lists').create(l => {
        l.familyId = 'family-1';
        l.name = 'Test List';
        l.type = 'TODO';
      });
    });

    // Create items with different completion states
    await database.write(async () => {
      // Create 2 unchecked items
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Unchecked Item 1';
        item.isChecked = false;
      });
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Unchecked Item 2';
        item.isChecked = false;
      });

      // Create 2 checked items
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Checked Item 1';
        item.isChecked = true;
      });
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Checked Item 2';
        item.isChecked = true;
      });
    });

    // Fetch all items
    const allItems = await database.collections
      .get<ListItem>('list_items')
      .query()
      .fetch();
    
    expect(allItems.length).toBe(4);

    // Simulate filtering like the component does
    const showCompleted = false;
    const displayedItems = showCompleted 
      ? allItems 
      : allItems.filter(item => !item.isChecked);

    expect(displayedItems.length).toBe(2);
    expect(displayedItems.every(item => !item.isChecked)).toBe(true);
  });

  it('should show all items when showCompleted is true', async () => {
    // Create a list
    const list = await database.write(async () => {
      return await database.get<List>('lists').create(l => {
        l.familyId = 'family-1';
        l.name = 'Test List';
        l.type = 'TODO';
      });
    });

    // Create items with different completion states
    await database.write(async () => {
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Unchecked Item';
        item.isChecked = false;
      });
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Checked Item';
        item.isChecked = true;
      });
    });

    // Fetch all items
    const allItems = await database.collections
      .get<ListItem>('list_items')
      .query()
      .fetch();
    
    expect(allItems.length).toBe(2);

    // Simulate filtering like the component does
    const showCompleted = true;
    const displayedItems = showCompleted 
      ? allItems 
      : allItems.filter(item => !item.isChecked);

    expect(displayedItems.length).toBe(2);
  });

  it('should successfully clear completed items', async () => {
    // Create a list
    const list = await database.write(async () => {
      return await database.get<List>('lists').create(l => {
        l.familyId = 'family-1';
        l.name = 'Test List';
        l.type = 'TODO';
      });
    });

    // Create items with different completion states
    await database.write(async () => {
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Unchecked Item';
        item.isChecked = false;
      });
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Checked Item 1';
        item.isChecked = true;
      });
      await database.get<ListItem>('list_items').create(item => {
        item.listId = list.id;
        item.text = 'Checked Item 2';
        item.isChecked = true;
      });
    });

    // Get all items
    const allItems = await database.collections
      .get<ListItem>('list_items')
      .query()
      .fetch();
    
    expect(allItems.length).toBe(3);

    // Delete checked items (simulating handleClearCompleted)
    const checkedItems = allItems.filter(item => item.isChecked);
    expect(checkedItems.length).toBe(2);

    await database.write(async () => {
      for (const item of checkedItems) {
        await item.markAsDeleted();
      }
    });

    // Verify only unchecked items remain
    const remainingItems = await database.collections
      .get<ListItem>('list_items')
      .query()
      .fetch();
    
    expect(remainingItems.length).toBe(1);
    expect(remainingItems[0].isChecked).toBe(false);
    expect(remainingItems[0].text).toBe('Unchecked Item');
  });
});
