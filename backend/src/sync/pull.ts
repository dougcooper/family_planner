import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { users, notifications, tasks, events, mealPlans, groceryItems, rewards, rewardClaims, families, lists, listItems, recipes, mealLabels } from '../db/schema.js';
import { eq, gt, and } from 'drizzle-orm';

export interface SyncPullQuery {
  last_pulled_at?: string;
  schema_version?: string;
}

// Helper to map Drizzle camelCase to WatermelonDB snake_case
export const toWatermelon = (record: Record<string, unknown>) => {
  const newRecord: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(record)) {
    // Handle timestamps
    if (key === 'createdAt') {
      newRecord.created_at = new Date(value as string | number | Date).getTime();
      continue;
    }
    if (key === 'updatedAt') {
      newRecord.updated_at = new Date(value as string | number | Date).getTime();
      continue;
    }
    if (key === 'dueDate' && value) {
      newRecord.due_date = new Date(value as string | number | Date).getTime();
      continue;
    }
    if (key === 'startTime') {
      newRecord.start_time = new Date(value as string | number | Date).getTime();
      continue;
    }
    if (key === 'endTime') {
      newRecord.end_time = new Date(value as string | number | Date).getTime();
      continue;
    }
    if (key === 'claimedAt' && value) {
      newRecord.claimed_at = new Date(value as string | number | Date).getTime();
      continue;
    }
    if (key === 'unclaimedAt' && value) {
      newRecord.unclaimed_at = new Date(value as string | number | Date).getTime();
      continue;
    }
    if (key === 'date') {
      if (value instanceof Date) {
        // Use UTC methods to avoid timezone shifts when the server is not in UTC
        // Date-only fields are typically parsed as UTC midnight
        const year = value.getUTCFullYear();
        const month = String(value.getUTCMonth() + 1).padStart(2, '0');
        const day = String(value.getUTCDate()).padStart(2, '0');
        newRecord.date = `${year}-${month}-${day}`;
      } else if (typeof value === 'string') {
        // Ensure it's just YYYY-MM-DD
        newRecord.date = value.split('T')[0];
      }
      // console.log('Pulling date:', value, '->', newRecord.date);
      continue;
    }

    // Handle camelCase to snake_case mapping
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newRecord[snakeKey] = value;
  }
  return newRecord;
};

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

    const lastPulledDate = isNaN(lastPulledAt) ? new Date(0) : new Date(lastPulledAt);

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
      rewardClaimChanges,
      listChanges,
      listItemChanges,
      recipeChanges,
      mealLabelChanges,
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
      db
        .select()
        .from(rewardClaims)
        .innerJoin(rewards, eq(rewardClaims.rewardId, rewards.id))
        .where(
          and(
            eq(rewards.familyId, familyId),
            gt(rewardClaims.updatedAt, lastPulledDate)
          )
        )
        .then(rows => rows.map(row => row.reward_claims)),
      db
        .select()
        .from(lists)
        .where(
          and(
            eq(lists.familyId, familyId),
            gt(lists.updatedAt, lastPulledDate)
          )
        ),
      db
        .select({
          id: listItems.id,
          listId: listItems.listId,
          text: listItems.text,
          isChecked: listItems.isChecked,
          createdAt: listItems.createdAt,
          updatedAt: listItems.updatedAt,
        })
        .from(listItems)
        .innerJoin(lists, eq(listItems.listId, lists.id))
        .where(
          and(
            eq(lists.familyId, familyId),
            gt(listItems.updatedAt, lastPulledDate)
          )
        ),
      db
        .select()
        .from(recipes)
        .where(
          and(
            eq(recipes.familyId, familyId),
            gt(recipes.updatedAt, lastPulledDate)
          )
        ),
      db
        .select()
        .from(mealLabels)
        .where(
          and(
            eq(mealLabels.familyId, familyId),
            gt(mealLabels.updatedAt, lastPulledDate)
          )
        ),
    ]);

    // Format response for WatermelonDB
    if (mealPlanChanges.length > 0) {
      console.log('Pulling meal plans:', JSON.stringify(mealPlanChanges, null, 2));
    }

    const changes = {
      families: {
        created: familyChanges.filter(f => f.createdAt > lastPulledDate).map(toWatermelon),
        updated: familyChanges.filter(f => f.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      users: {
        created: userChanges.filter(u => u.createdAt > lastPulledDate).map(toWatermelon),
        updated: userChanges.filter(u => u.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      notifications: {
        created: notificationChanges.filter(n => n.createdAt > lastPulledDate).map(toWatermelon),
        updated: notificationChanges.filter(n => n.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      tasks: {
        created: taskChanges.filter(t => t.createdAt > lastPulledDate).map(toWatermelon),
        updated: taskChanges.filter(t => t.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      events: {
        created: eventChanges.filter(e => e.createdAt > lastPulledDate).map(toWatermelon),
        updated: eventChanges.filter(e => e.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      meal_plans: {
        created: mealPlanChanges.filter(m => m.createdAt > lastPulledDate).map(toWatermelon),
        updated: mealPlanChanges.filter(m => m.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      grocery_items: {
        created: groceryItemChanges.filter(g => g.createdAt > lastPulledDate).map(toWatermelon),
        updated: groceryItemChanges.filter(g => g.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      rewards: {
        created: rewardChanges.filter(r => r.createdAt > lastPulledDate).map(toWatermelon),
        updated: rewardChanges.filter(r => r.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      reward_claims: {
        created: rewardClaimChanges.filter(rc => rc.createdAt > lastPulledDate).map(toWatermelon),
        updated: rewardClaimChanges.filter(rc => rc.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      lists: {
        created: listChanges.filter(l => l.createdAt > lastPulledDate).map(toWatermelon),
        updated: listChanges.filter(l => l.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      list_items: {
        created: listItemChanges.filter(l => l.createdAt > lastPulledDate).map(toWatermelon),
        updated: listItemChanges.filter(l => l.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      recipes: {
        created: recipeChanges.filter(r => r.createdAt > lastPulledDate).map(toWatermelon),
        updated: recipeChanges.filter(r => r.createdAt <= lastPulledDate).map(toWatermelon),
        deleted: [],
      },
      meal_labels: {
        created: mealLabelChanges.filter(m => m.createdAt > lastPulledDate).map(toWatermelon),
        updated: mealLabelChanges.filter(m => m.createdAt <= lastPulledDate).map(toWatermelon),
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
