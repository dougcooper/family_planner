import { db } from '../db';
import { tasks, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../logger.js';

/**
 * Point awarding service - handles parent approval and point distribution
 */

export async function approveTaskAndAwardPoints(
  taskId: string,
  approverId: string
): Promise<{ success: boolean; pointsAwarded: number; error?: string }> {
  try {
    // Get the task
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    
    if (!task) {
      return { success: false, pointsAwarded: 0, error: 'Task not found' };
    }

    // Verify task is in PENDING_REVIEW status
    if (task.status !== 'PENDING_REVIEW') {
      return { 
        success: false, 
        pointsAwarded: 0, 
        error: 'Task must be in PENDING_REVIEW status' 
      };
    }

    // Verify approver is a PARENT
    const [approver] = await db.select().from(users).where(eq(users.id, approverId));
    
    if (!approver) {
      return { success: false, pointsAwarded: 0, error: 'Approver not found' };
    }

    if (approver.role !== 'PARENT') {
      return { 
        success: false, 
        pointsAwarded: 0, 
        error: 'Only parents can approve tasks' 
      };
    }

    // Get the assignee
    const [assignee] = await db.select().from(users).where(eq(users.id, task.assigneeId));
    
    if (!assignee) {
      return { success: false, pointsAwarded: 0, error: 'Assignee not found' };
    }

    // Update task status to COMPLETED
    await db
      .update(tasks)
      .set({ 
        status: 'COMPLETED',
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));

    // Award points to assignee
    const newBalance = assignee.pointsBalance + task.points;
    await db
      .update(users)
      .set({ 
        pointsBalance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, task.assigneeId));

    return { 
      success: true, 
      pointsAwarded: task.points 
    };
  } catch (error) {
    logger.error({ err: error }, 'Error approving task and awarding points');
    return { 
      success: false, 
      pointsAwarded: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function rejectTaskCompletion(
  taskId: string,
  rejectorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the task
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // Verify task is in PENDING_REVIEW status
    if (task.status !== 'PENDING_REVIEW') {
      return { 
        success: false, 
        error: 'Task must be in PENDING_REVIEW status' 
      };
    }

    // Verify rejector is a PARENT
    const [rejector] = await db.select().from(users).where(eq(users.id, rejectorId));
    
    if (!rejector) {
      return { success: false, error: 'Rejector not found' };
    }

    if (rejector.role !== 'PARENT') {
      return { 
        success: false, 
        error: 'Only parents can reject tasks' 
      };
    }

    // Update task status back to TODO
    await db
      .update(tasks)
      .set({ 
        status: 'TODO',
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, 'Error rejecting task');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
