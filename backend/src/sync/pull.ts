import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { users, families, notifications, tasks, events, mealPlans, groceryItems, rewards } from '../db/schema.js';
import { eq, gt, and } from 'drizzle-orm';

export interface SyncPullQuery {
  last_pulled_at?: string;
  schema_version?: string;
}

export async function pullChanges(
  request: FastifyRequest<{ Querystring: SyncPullQuery }>,
  reply: FastifyReply
) {
  try {
    // @ts-expect-error - userId set by auth middleware
    const { familyId } = request.user;
    const lastPulledAt = request.query.last_pulled_at 
      ? parseInt(request.query.last_pulled_at, 10) 
      : 0;

    const lastPulledDate = new Date(lastPulledAt);

    // Fetch all changes since last sync
    const [
      familyChanges,
      userChanges,
      notificationChanges,
      taskChanges,
      eventChanges,
      mealPlanChanges,
      groceryItemChanges,
      rewardChanges,
    ] = await Promise.all([
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
      db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.familyId, familyId),
            gt(tasks.updatedAt, lastPulledDate)
          )
        ),
      db
        .select()
        .from(events)
        .where(
          and(
            eq(events.familyId, familyId),
            gt(events.updatedAt, lastPulledDate)
          )
        ),
      db
        .select()
        .from(mealPlans)
        .where(
          and(
            eq(mealPlans.familyId, familyId),
            gt(mealPlans.updatedAt, lastPulledDate)
          )
        ),
      db
        .select()
        .from(groceryItems)
        .where(
          and(
            eq(groceryItems.familyId, familyId),
            gt(groceryItems.updatedAt, lastPulledDate)
          )
        ),
      db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.familyId, familyId),
            gt(rewards.updatedAt, lastPulledDate)
          )
        ),
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
      tasks: {
        created: taskChanges.filter(t => t.createdAt > lastPulledDate),
        updated: taskChanges.filter(t => t.createdAt <= lastPulledDate),
        deleted: [],
      },
      events: {
        created: eventChanges.filter(e => e.createdAt > lastPulledDate),
        updated: eventChanges.filter(e => e.createdAt <= lastPulledDate),
        deleted: [],
      },
      meal_plans: {
        created: mealPlanChanges.filter(m => m.createdAt > lastPulledDate),
        updated: mealPlanChanges.filter(m => m.createdAt <= lastPulledDate),
        deleted: [],
      },
      grocery_items: {
        created: groceryItemChanges.filter(g => g.createdAt > lastPulledDate),
        updated: groceryItemChanges.filter(g => g.createdAt <= lastPulledDate),
        deleted: [],
      },
      rewards: {
        created: rewardChanges.filter(r => r.createdAt > lastPulledDate),
        updated: rewardChanges.filter(r => r.createdAt <= lastPulledDate),
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
