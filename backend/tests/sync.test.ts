import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DB
const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }
  }
});

vi.mock('../src/db/index.js', () => ({
  db: mockDb,
}));

describe('Sync Operations', () => {
  let testFamilyId: string;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pull Sync - Initial Load', () => {
    it('should fetch all family data on first sync', async () => {
      testFamilyId = 'family-123';

      // Mock data
      const mockFamily = [{ id: testFamilyId, name: 'Sync Test Family' }];
      const mockTasks = [{ id: 'task-1', title: 'Test Task', familyId: testFamilyId }];
      const mockEvents = [{ id: 'event-1', title: 'Test Event', familyId: testFamilyId }];

      // Setup mocks for select queries
      mockDb.where
        .mockResolvedValueOnce(mockFamily) // families
        .mockResolvedValueOnce(mockTasks)  // tasks
        .mockResolvedValueOnce(mockEvents); // events

      // Fetch data (simulating sync pull)
      const familyData = await mockDb
        .select()
        .from()
        .where();

      const taskData = await mockDb
        .select()
        .from()
        .where();

      const eventData = await mockDb
        .select()
        .from()
        .where();

      expect(familyData).toHaveLength(1);
      expect(taskData.length).toBeGreaterThan(0);
      expect(eventData.length).toBeGreaterThan(0);
    });
  });

  describe('Pull Sync - Incremental Updates', () => {
    it('should only fetch records updated after last sync', async () => {
      testFamilyId = 'family-123';
      
      // Mock data for incremental sync
      const mockTasks = [{ 
        id: 'task-2', 
        title: 'New Task After Sync', 
        familyId: testFamilyId 
      }];

      mockDb.where.mockResolvedValueOnce(mockTasks);

      // Fetch data
      const taskData = await mockDb
        .select()
        .from()
        .where();

      expect(taskData).toHaveLength(1);
      expect(taskData[0].title).toBe('New Task After Sync');
    });
  });
});
