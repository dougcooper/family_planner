
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pullChanges } from '../src/sync/pull.js';
import { pushChanges } from '../src/sync/push.js';

// Mock DB
const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }
  };
});

vi.mock('../src/db/index.js', () => ({
  db: mockDb,
}));

vi.mock('../src/db/schema.js', () => ({
  users: 'users',
  families: 'families',
  notifications: 'notifications',
  tasks: 'tasks',
  events: 'events',
  mealPlans: 'mealPlans',
  groceryItems: 'groceryItems',
  rewards: 'rewards',
  lists: 'lists',
  listItems: { id: 'id', listId: 'listId', text: 'text', isChecked: 'isChecked', createdAt: 'createdAt', updatedAt: 'updatedAt' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  gt: vi.fn(),
  and: vi.fn(),
  inArray: vi.fn(),
}));

describe('Sync Lists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pullChanges should include lists and listItems', async () => {
    const req = {
      user: { familyId: 'family-1' },
      query: { last_pulled_at: '0' },
      log: { error: vi.fn() },
    };
    const reply = {
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    // Mock DB responses for Promise.all
    // Order: families, users, notifications, tasks, events, mealPlans, groceryItems, rewards, lists, listItems
    mockDb.where
      .mockResolvedValueOnce([]) // families
      .mockResolvedValueOnce([]) // users
      .mockResolvedValueOnce([]) // notifications
      .mockResolvedValueOnce([]) // tasks
      .mockResolvedValueOnce([]) // events
      .mockResolvedValueOnce([]) // mealPlans
      .mockResolvedValueOnce([]) // groceryItems
      .mockResolvedValueOnce([]) // rewards
      .mockResolvedValueOnce([{ id: 'list-1', name: 'My List', createdAt: new Date(), updatedAt: new Date() }]) // lists
      .mockResolvedValueOnce([{ id: 'item-1', listId: 'list-1', text: 'Item 1', createdAt: new Date(), updatedAt: new Date() }]); // listItems

    // @ts-expect-error - Mocking request/reply objects partially
    await pullChanges(req, reply);

    expect(reply.send).toHaveBeenCalled();
    const response = reply.send.mock.calls[0][0];
    expect(response.changes).toHaveProperty('lists');
    expect(response.changes).toHaveProperty('list_items');
    expect(response.changes.lists.created).toHaveLength(1);
    expect(response.changes.list_items.created).toHaveLength(1);
  });

  it('pushChanges should handle lists and listItems', async () => {
    const req = {
      user: { userId: 'user-1', familyId: 'family-1' },
      body: {
        changes: {
          lists: {
            created: [{ id: 'list-1', name: 'New List' }],
            updated: [],
            deleted: [],
          },
          list_items: {
            created: [{ id: 'item-1', list_id: 'list-1', text: 'New Item' }],
            updated: [],
            deleted: [],
          },
        },
        last_pulled_at: 0,
      },
      log: { error: vi.fn() },
    };
    const reply = {
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    // @ts-expect-error - Mocking request/reply objects partially
    await pushChanges(req, reply);

    expect(mockDb.insert).toHaveBeenCalledTimes(2); // Once for list, once for item
    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });
});
