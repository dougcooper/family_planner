import { describe, it, expect, beforeEach, vi } from 'vitest';
import { approveTaskAndAwardPoints, rejectTaskCompletion } from '../src/services/points.js';

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
    }
  }
});

vi.mock('../src/db/index.js', () => ({
  db: mockDb,
}));

describe('Points Service', () => {
  const testParentId = 'parent-123';
  const testChildId = 'child-123';
  const testTaskId = 'task-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Approval and Point Awarding', () => {
    it('should approve task and award points when valid', async () => {
      // Mock data
      const mockTask = {
        id: testTaskId,
        status: 'PENDING_REVIEW',
        points: 10,
        assigneeId: testChildId,
      };
      const mockParent = { id: testParentId, role: 'PARENT' };
      const mockChild = { id: testChildId, pointsBalance: 50 };

      // Setup mock responses
      mockDb.where.mockResolvedValueOnce([mockTask]) // Get task
        .mockResolvedValueOnce([mockParent]) // Get approver
        .mockResolvedValueOnce([mockChild]); // Get assignee

      const result = await approveTaskAndAwardPoints(testTaskId, testParentId);

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(10);
      
      // Verify DB updates
      expect(mockDb.update).toHaveBeenCalledTimes(2);
      // Verify task status update
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED' }));
      // Verify points update
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ pointsBalance: 60 }));
    });

    it('should fail if task not found', async () => {
      mockDb.where.mockResolvedValueOnce([]); // Task not found

      const result = await approveTaskAndAwardPoints(testTaskId, testParentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task not found');
    });

    it('should fail if task not in PENDING_REVIEW', async () => {
      const mockTask = {
        id: testTaskId,
        status: 'TODO',
        points: 10,
        assigneeId: testChildId,
      };
      mockDb.where.mockResolvedValueOnce([mockTask]);

      const result = await approveTaskAndAwardPoints(testTaskId, testParentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task must be in PENDING_REVIEW status');
    });

    it('should fail if approver is not a parent', async () => {
      const mockTask = {
        id: testTaskId,
        status: 'PENDING_REVIEW',
        points: 10,
        assigneeId: testChildId,
      };
      mockDb.where.mockResolvedValueOnce([mockTask])
        .mockResolvedValueOnce([{ id: testParentId, role: 'CHILD' }]);

      const result = await approveTaskAndAwardPoints(testTaskId, testParentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only parents can approve tasks');
    });
  });

  describe('Task Rejection', () => {
    it('should reject task and reset status to TODO', async () => {
      const mockTask = {
        id: testTaskId,
        status: 'PENDING_REVIEW',
        assigneeId: testChildId,
      };
      const mockParent = { id: testParentId, role: 'PARENT' };

      mockDb.where.mockResolvedValueOnce([mockTask])
        .mockResolvedValueOnce([mockParent]);

      const result = await rejectTaskCompletion(testTaskId, testParentId);

      expect(result.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'TODO' }));
    });
  });
});
