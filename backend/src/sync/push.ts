import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { users, notifications, tasks, events, mealPlans, groceryItems, rewards, families } from '../db/schema.js';
import { eq } from 'drizzle-orm';

interface ChangeRecord {
  id: string;
  [key: string]: unknown;
}

export interface SyncPushBody {
  changes: {
    [tableName: string]: {
      created: ChangeRecord[];
      updated: ChangeRecord[];
      deleted: string[];
    };
  };
  last_pulled_at: number;
}

export async function pushChanges(
  request: FastifyRequest<{ Body: SyncPushBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-expect-error - userId set by auth middleware
    const { userId, familyId } = request.user;
    const { changes } = request.body;

    // Process each table's changes
    for (const [tableName, tableChanges] of Object.entries(changes)) {
      // Handle created records
      for (const record of tableChanges.created || []) {
        switch (tableName) {
          case 'notifications':
            await db.insert(notifications).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              userId,
            });
            break;
          case 'families':
            await db.insert(families).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              kioskTimeoutSeconds: (record as any).kiosk_timeout_seconds,
            });
            break;
          case 'tasks':
            await db.insert(tasks).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
            });
            break;
          case 'events':
            await db.insert(events).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
            });
            break;
          case 'meal_plans':
            await db.insert(mealPlans).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
            });
            break;
          case 'grocery_items':
            await db.insert(groceryItems).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
            });
            break;
          case 'rewards':
            await db.insert(rewards).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
            });
            break;
        }
      }

      // Handle updated records
      for (const record of tableChanges.updated || []) {
        switch (tableName) {
          case 'families':
            await db
              .update(families)
              .set({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name: (record as any).name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                kioskTimeoutSeconds: (record as any).kiosk_timeout_seconds,
                updatedAt: new Date(),
              })
              .where(eq(families.id, record.id));
            break;
          case 'users':
            await db
              .update(users)
              .set({
                ...(record as unknown as Record<string, never>),
                updatedAt: new Date(),
              })
              .where(eq(users.id, record.id));
            break;
          case 'notifications':
            await db
              .update(notifications)
              .set({
                ...(record as unknown as Record<string, never>),
                updatedAt: new Date(),
              })
              .where(eq(notifications.id, record.id));
            break;
          case 'tasks':
            await db
              .update(tasks)
              .set({
                ...(record as unknown as Record<string, never>),
                updatedAt: new Date(),
              })
              .where(eq(tasks.id, record.id));
            break;
          case 'events':
            await db
              .update(events)
              .set({
                ...(record as unknown as Record<string, never>),
                updatedAt: new Date(),
              })
              .where(eq(events.id, record.id));
            break;
          case 'meal_plans':
            await db
              .update(mealPlans)
              .set({
                ...(record as unknown as Record<string, never>),
                updatedAt: new Date(),
              })
              .where(eq(mealPlans.id, record.id));
            break;
          case 'grocery_items':
            await db
              .update(groceryItems)
              .set({
                ...(record as unknown as Record<string, never>),
                updatedAt: new Date(),
              })
              .where(eq(groceryItems.id, record.id));
            break;
          case 'rewards':
            await db
              .update(rewards)
              .set({
                ...(record as unknown as Record<string, never>),
                updatedAt: new Date(),
              })
              .where(eq(rewards.id, record.id));
            break;
        }
      }

      // Handle deleted records (soft delete recommended for sync)
      // Implementation depends on soft delete strategy
    }

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.status(500).send({ error: `Sync push failed: ${errorMessage}` });
  }
}
