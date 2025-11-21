import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { users, notifications } from '../db/schema.js';
import { eq } from 'drizzle-orm';

interface SyncPushBody {
  changes: {
    [tableName: string]: {
      created: any[];
      updated: any[];
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
    // @ts-ignore - userId set by auth middleware
    const { userId, familyId } = request.user;
    const { changes } = request.body;

    // Process each table's changes
    for (const [tableName, tableChanges] of Object.entries(changes)) {
      // Handle created records
      for (const record of tableChanges.created) {
        switch (tableName) {
          case 'notifications':
            await db.insert(notifications).values({
              ...record,
              userId,
            });
            break;
          // Add more tables as needed
        }
      }

      // Handle updated records
      for (const record of tableChanges.updated) {
        switch (tableName) {
          case 'users':
            await db
              .update(users)
              .set({
                ...record,
                updatedAt: new Date(),
              })
              .where(eq(users.id, record.id));
            break;
          case 'notifications':
            await db
              .update(notifications)
              .set({
                ...record,
                updatedAt: new Date(),
              })
              .where(eq(notifications.id, record.id));
            break;
        }
      }

      // Handle deleted records (soft delete recommended for sync)
      // Implementation depends on soft delete strategy
    }

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Sync push failed' });
  }
}
