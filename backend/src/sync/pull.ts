import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { users, families, notifications } from '../db/schema.js';
import { eq, gt, and } from 'drizzle-orm';

interface SyncPullQuery {
  last_pulled_at?: string;
  schema_version?: string;
}

export async function pullChanges(
  request: FastifyRequest<{ Querystring: SyncPullQuery }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - userId set by auth middleware
    const { familyId } = request.user;
    const lastPulledAt = request.query.last_pulled_at 
      ? parseInt(request.query.last_pulled_at, 10) 
      : 0;

    const lastPulledDate = new Date(lastPulledAt);

    // Fetch all changes since last sync
    const [familyChanges, userChanges, notificationChanges] = await Promise.all([
      db
        .select()
        .from(families)
        .where(
          and(
            eq(families.id, familyId),
            gt(families.updatedAt, lastPulledDate)
          )
        ),
      db
        .select()
        .from(users)
        .where(
          and(
            eq(users.familyId, familyId),
            gt(users.updatedAt, lastPulledDate)
          )
        ),
      db
        .select()
        .from(notifications)
        .where(gt(notifications.updatedAt, lastPulledDate)),
    ]);

    // Format response for WatermelonDB
    const changes = {
      families: {
        created: familyChanges.filter(f => f.createdAt > lastPulledDate),
        updated: familyChanges.filter(f => f.createdAt <= lastPulledDate),
        deleted: [],
      },
      users: {
        created: userChanges.filter(u => u.createdAt > lastPulledDate),
        updated: userChanges.filter(u => u.createdAt <= lastPulledDate),
        deleted: [],
      },
      notifications: {
        created: notificationChanges.filter(n => n.createdAt > lastPulledDate),
        updated: notificationChanges.filter(n => n.createdAt <= lastPulledDate),
        deleted: [],
      },
    };

    return reply.send({
      changes,
      timestamp: Date.now(),
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Sync pull failed' });
  }
}
