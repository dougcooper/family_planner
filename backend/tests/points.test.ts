import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../src/db/index.js';
import { families, users, tasks } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { approveTaskAndAwardPoints, rejectTaskCompletion } from '../src/services/points.js';

// Helper function to get user points balance
async function getUserPointsBalance(userId: string): Promise<number> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user?.pointsBalance || 0;
}

describe('Points Service', () => {
  let testFamilyId: string;
  let testParentId: string;
  let testChildId: string;
  let testTaskId: string;

  beforeAll(async () => {
    // Create test family
    const [family] = await db
      .insert(families)
      .values({ name: 'Test Points Family' })
      .returning();
    testFamilyId = family.id;

    // Create parent user
    const [parent] = await db
      .insert(users)
      .values({
        familyId: testFamilyId,
        email: `parent-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password', 10),
        name: 'Test Parent',
        role: 'PARENT',
        pinHash: await bcrypt.hash('1234', 10),
        pointsBalance: 0,
      })
      .returning();
    testParentId = parent.id;

    // Create child user
    const [child] = await db
      .insert(users)
      .values({
        familyId: testFamilyId,
        email: `child-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password', 10),
        name: 'Test Child',
        role: 'CHILD',
        pinHash: await bcrypt.hash('5678', 10),
        pointsBalance: 0,
      })
      .returning();
    testChildId = child.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testTaskId) {
      await db.delete(tasks).where(eq(tasks.id, testTaskId));
    }
    if (testChildId) {
      await db.delete(users).where(eq(users.id, testChildId));
    }
    if (testParentId) {
      await db.delete(users).where(eq(users.id, testParentId));
    }
    if (testFamilyId) {
      await db.delete(families).where(eq(families.id, testFamilyId));
    }
  });

  describe('Task Approval and Point Awarding', () => {
    it('should award points when parent approves task', async () => {
      // Create task in PENDING_REVIEW status
      const [task] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Test Task',
          description: 'Test task for points',
          status: 'PENDING_REVIEW',
          points: 50,
          assigneeId: testChildId,
          creatorId: testParentId,
        })
        .returning();
      testTaskId = task.id;

      const result = await approveTaskAndAwardPoints(task.id, testParentId);

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(50);

      // Verify task status updated
      const [updatedTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));
      expect(updatedTask.status).toBe('COMPLETED');

      // Verify points awarded
      const [updatedChild] = await db
        .select()
        .from(users)
        .where(eq(users.id, testChildId));
      expect(updatedChild.pointsBalance).toBe(50);
    });

    it('should fail if task is not in PENDING_REVIEW status', async () => {
      const [todoTask] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'TODO Task',
          description: 'Task in TODO status',
          status: 'TODO',
          points: 30,
          assigneeId: testChildId,
          creatorId: testParentId,
        })
        .returning();

      const result = await approveTaskAndAwardPoints(todoTask.id, testParentId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('PENDING_REVIEW');
      expect(result.pointsAwarded).toBe(0);

      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, todoTask.id));
    });

    it('should fail if approver is not a PARENT', async () => {
      const [task] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Another Task',
          description: 'Task for child approval test',
          status: 'PENDING_REVIEW',
          points: 25,
          assigneeId: testChildId,
          creatorId: testParentId,
        })
        .returning();

      const result = await approveTaskAndAwardPoints(task.id, testChildId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('parents');
      expect(result.pointsAwarded).toBe(0);

      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, task.id));
    });

    it('should fail if task does not exist', async () => {
      // Use a properly formatted UUID that doesn't exist
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const result = await approveTaskAndAwardPoints(fakeUuid, testParentId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Task Rejection', () => {
    it('should reset task to TODO when rejected', async () => {
      const [task] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Task to Reject',
          description: 'This task will be rejected',
          status: 'PENDING_REVIEW',
          points: 40,
          assigneeId: testChildId,
          creatorId: testParentId,
        })
        .returning();

      const result = await rejectTaskCompletion(task.id, testParentId);

      expect(result.success).toBe(true);

      // Verify task status
      const [rejectedTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));
      expect(rejectedTask.status).toBe('TODO');

      // Verify no points were awarded
      const balance = await getUserPointsBalance(testChildId);
      expect(balance).toBe(50); // Only from the previous approved task

      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, task.id));
    });

    it('should fail if rejector is not a PARENT', async () => {
      const [task] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Task for Child Rejection Test',
          status: 'PENDING_REVIEW',
          points: 20,
          assigneeId: testChildId,
          creatorId: testParentId,
        })
        .returning();

      const result = await rejectTaskCompletion(task.id, testChildId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('parents');

      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, task.id));
    });
  });

  describe('Points Balance', () => {
    it('should return correct points balance for user', async () => {
      const balance = await getUserPointsBalance(testChildId);
      expect(balance).toBe(50); // From the approved task in first test
    });

    it('should return 0 for user with no points', async () => {
      const balance = await getUserPointsBalance(testParentId);
      expect(balance).toBe(0);
    });
  });

  describe('Point Accumulation', () => {
    it('should accumulate points across multiple task approvals', async () => {
      // Get initial balance
      const initialBalance = await getUserPointsBalance(testChildId);

      // Create and approve first task
      const [task1] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Task 1',
          status: 'PENDING_REVIEW',
          points: 10,
          assigneeId: testChildId,
          creatorId: testParentId,
        })
        .returning();

      await approveTaskAndAwardPoints(task1.id, testParentId);

      // Create and approve second task
      const [task2] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Task 2',
          status: 'PENDING_REVIEW',
          points: 15,
          assigneeId: testChildId,
          creatorId: testParentId,
        })
        .returning();

      await approveTaskAndAwardPoints(task2.id, testParentId);

      // Verify accumulated points
      const finalBalance = await getUserPointsBalance(testChildId);
      expect(finalBalance).toBe(initialBalance + 10 + 15);

      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, task1.id));
      await db.delete(tasks).where(eq(tasks.id, task2.id));
    });
  });
});
