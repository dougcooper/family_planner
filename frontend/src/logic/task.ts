import { Database } from '@nozbe/watermelondb';
import { Task } from '../model/models';

/**
 * Task status transition logic
 * Flow: TODO -> PENDING_REVIEW -> COMPLETED
 */

export async function markTaskPendingReview(database: Database, taskId: string): Promise<Task> {
  const task = await database.get<Task>('tasks').find(taskId);
  
  await database.write(async () => {
    await task.update((t) => {
      if (t.status !== 'TODO') {
        throw new Error('Task must be in TODO status to mark as pending review');
      }
      t.status = 'PENDING_REVIEW';
    });
  });

  return task;
}

export async function approveTask(database: Database, taskId: string): Promise<Task> {
  const task = await database.get<Task>('tasks').find(taskId);
  
  await database.write(async () => {
    await task.update((t) => {
      if (t.status !== 'PENDING_REVIEW') {
        throw new Error('Task must be in PENDING_REVIEW status to approve');
      }
      t.status = 'COMPLETED';
    });
  });

  return task;
}

export async function rejectTask(database: Database, taskId: string): Promise<Task> {
  const task = await database.get<Task>('tasks').find(taskId);
  
  await database.write(async () => {
    await task.update((t) => {
      if (t.status !== 'PENDING_REVIEW') {
        throw new Error('Task must be in PENDING_REVIEW status to reject');
      }
      t.status = 'TODO';
    });
  });

  return task;
}

export async function resetTask(database: Database, taskId: string): Promise<Task> {
  const task = await database.get<Task>('tasks').find(taskId);
  
  await database.write(async () => {
    await task.update((t) => {
      t.status = 'TODO';
    });
  });

  return task;
}
