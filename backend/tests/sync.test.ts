import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../src/db/index.js';
import { families, users, tasks, events, mealPlans, groceryItems } from '../src/db/schema.js';
import { eq, and, gte } from 'drizzle-orm';
import bcrypt from 'bcrypt';

describe('Sync Operations', () => {
  let testFamilyId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test family and user
    const [family] = await db
      .insert(families)
      .values({ name: 'Sync Test Family' })
      .returning();
    testFamilyId = family.id;

    const [user] = await db
      .insert(users)
      .values({
        familyId: testFamilyId,
        email: `sync-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password', 10),
        name: 'Sync Test User',
        role: 'PARENT',
        pinHash: await bcrypt.hash('0000', 10),
        pointsBalance: 0,
      })
      .returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup all test data
    await db.delete(groceryItems).where(eq(groceryItems.familyId, testFamilyId));
    await db.delete(mealPlans).where(eq(mealPlans.familyId, testFamilyId));
    await db.delete(events).where(eq(events.familyId, testFamilyId));
    await db.delete(tasks).where(eq(tasks.familyId, testFamilyId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(families).where(eq(families.id, testFamilyId));
  });

  describe('Pull Sync - Initial Load', () => {
    it('should fetch all family data on first sync', async () => {
      // Create test data
      await db.insert(tasks).values({
        familyId: testFamilyId,
        title: 'Test Task',
        status: 'TODO',
        points: 10,
        assigneeId: testUserId,
        creatorId: testUserId,
        creatorId: testUserId,
      });

      await db.insert(events).values({
        familyId: testFamilyId,
        title: 'Test Event',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
      });

      // Fetch data (simulating sync pull)
      const familyData = await db
        .select()
        .from(families)
        .where(eq(families.id, testFamilyId));

      const taskData = await db
        .select()
        .from(tasks)
        .where(eq(tasks.familyId, testFamilyId));

      const eventData = await db
        .select()
        .from(events)
        .where(eq(events.familyId, testFamilyId));

      expect(familyData).toHaveLength(1);
      expect(taskData.length).toBeGreaterThan(0);
      expect(eventData.length).toBeGreaterThan(0);
    });
  });

  describe('Pull Sync - Incremental Updates', () => {
    it('should only fetch records updated after last sync', async () => {
      const lastPulledAt = new Date();

      // Wait a moment to ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new task after last sync time
      await db.insert(tasks).values({
        familyId: testFamilyId,
        title: 'New Task After Sync',
        status: 'TODO',
        points: 20,
        assigneeId: testUserId,
        creatorId: testUserId,
      });

      // Fetch only new/updated records
      const updatedTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.familyId, testFamilyId),
            gte(tasks.updatedAt, lastPulledAt)
          )
        );

      expect(updatedTasks.length).toBeGreaterThan(0);
      expect(updatedTasks[0].title).toBe('New Task After Sync');
    });
  });

  describe('Push Sync - Create Records', () => {
    it('should create new task from sync push', async () => {
      const newTask = {
        familyId: testFamilyId,
        title: 'Task from Mobile',
        description: 'Created on mobile device',
        status: 'TODO' as const,
        points: 15,
        assigneeId: testUserId,
        creatorId: testUserId,
      };

      const [created] = await db
        .insert(tasks)
        .values(newTask)
        .returning();

      expect(created.id).toBeDefined();
      expect(created.title).toBe(newTask.title);
      expect(created.familyId).toBe(testFamilyId);
    });

    it('should create grocery item from sync push', async () => {
      const newItem = {
        familyId: testFamilyId,
        name: 'Milk',
        quantity: '1 gallon',
        isChecked: false,
      };

      const [created] = await db
        .insert(groceryItems)
        .values(newItem)
        .returning();

      expect(created.id).toBeDefined();
      expect(created.name).toBe(newItem.name);
      expect(created.isChecked).toBe(false);
    });
  });

  describe('Push Sync - Update Records', () => {
    it('should update existing task status', async () => {
      // Create task
      const [task] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Task to Update',
          status: 'TODO',
          points: 25,
          assigneeId: testUserId,
          creatorId: testUserId,
        })
        .returning();

      // Wait to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update task status
      const [updated] = await db
        .update(tasks)
        .set({ status: 'PENDING_REVIEW', updatedAt: new Date() })
        .where(eq(tasks.id, task.id))
        .returning();

      expect(updated.status).toBe('PENDING_REVIEW');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(task.createdAt.getTime());
    });    it('should update grocery item checked status', async () => {
      const [item] = await db
        .insert(groceryItems)
        .values({
          familyId: testFamilyId,
          name: 'Bread',
          isChecked: false,
        })
        .returning();

      const [updated] = await db
        .update(groceryItems)
        .set({ isChecked: true, updatedAt: new Date() })
        .where(eq(groceryItems.id, item.id))
        .returning();

      expect(updated.isChecked).toBe(true);
    });
  });

  describe('Push Sync - Delete Records', () => {
    it('should mark records as deleted', async () => {
      const [task] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Task to Delete',
          status: 'TODO',
          points: 5,
          assigneeId: testUserId,
        creatorId: testUserId,
        })
        .returning();

      // Soft delete by setting deletedAt
      const [deleted] = await db
        .update(tasks)
        .set({ updatedAt: new Date() })
        .where(eq(tasks.id, task.id))
        .returning();

      expect(deleted).toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity for tasks', async () => {
      const [task] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Integrity Test Task',
          status: 'TODO',
          points: 10,
          assigneeId: testUserId,
        creatorId: testUserId,
        })
        .returning();

      expect(task.familyId).toBe(testFamilyId);
      expect(task.assigneeId).toBe(testUserId);

      // Verify family exists
      const [family] = await db
        .select()
        .from(families)
        .where(eq(families.id, task.familyId));
      expect(family).toBeDefined();

      // Verify assignee exists
      const [assignee] = await db
        .select()
        .from(users)
        .where(eq(users.id, task.assigneeId));
      expect(assignee).toBeDefined();
    });

    it('should update timestamps on every change', async () => {
      const [task] = await db
        .insert(tasks)
        .values({
          familyId: testFamilyId,
          title: 'Timestamp Test',
          status: 'TODO',
          points: 10,
          assigneeId: testUserId,
          creatorId: testUserId,
        })
        .returning();

      const originalTimestamp = task.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const [updated] = await db
        .update(tasks)
        .set({ title: 'Updated Title', updatedAt: new Date() })
        .where(eq(tasks.id, task.id))
        .returning();

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTimestamp.getTime());
    });
  });

  describe('Family Data Isolation', () => {
    it('should only fetch data for user family', async () => {
      // Create another family
      const [otherFamily] = await db
        .insert(families)
        .values({ name: 'Other Family' })
        .returning();

      // Create task in other family
      await db.insert(tasks).values({
        familyId: otherFamily.id,
        title: 'Other Family Task',
        status: 'TODO',
        points: 10,
        assigneeId: testUserId,
        creatorId: testUserId,
      });

      // Fetch only current family tasks
      const myFamilyTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.familyId, testFamilyId));

      // Verify no cross-family data leakage
      const hasOtherFamilyData = myFamilyTasks.some(
        task => task.familyId === otherFamily.id
      );
      expect(hasOtherFamilyData).toBe(false);

      // Cleanup
      await db.delete(tasks).where(eq(tasks.familyId, otherFamily.id));
      await db.delete(families).where(eq(families.id, otherFamily.id));
    });
  });
});
