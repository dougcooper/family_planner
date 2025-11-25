import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { users, notifications, tasks, events, mealPlans, groceryItems, rewards, rewardClaims, families, lists, listItems, recipes } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              isRead: (record as any).is_read,
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
          case 'users':
            await db.insert(users).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pinHash: (record as any).pin_hash,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pointsBalance: (record as any).points_balance,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              emailFrequency: (record as any).email_frequency,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              avatarUrl: (record as any).avatar_url,
            });
            break;
          case 'tasks':
            await db.insert(tasks).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              assigneeId: (record as any).assignee_id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              creatorId: (record as any).creator_id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dueDate: (record as any).due_date ? new Date((record as any).due_date) : null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              recurrenceRule: (record as any).recurrence_rule,
            });

            // Point Awarding Logic for Created Tasks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((record as any).status === 'COMPLETED') {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const points = Number((record as any).points || 0);
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const assigneeId = (record as any).assignee_id;

               if (assigneeId && points > 0) {
                  const [assignee] = await db.select().from(users).where(eq(users.id, assigneeId));
                  if (assignee) {
                    await db.update(users)
                      .set({ 
                        pointsBalance: assignee.pointsBalance + points,
                        updatedAt: new Date()
                      })
                      .where(eq(users.id, assigneeId));
                  }
               }
            }
            break;
          case 'events':
            await db.insert(events).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              startTime: new Date((record as any).start_time),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              endTime: new Date((record as any).end_time),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              recurrenceRule: (record as any).recurrence_rule,
            });
            break;
          case 'meal_plans':
            console.log('Pushing meal plan:', JSON.stringify(record, null, 2));
            await db.insert(mealPlans).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              mealType: (record as any).meal_type,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              date: (record as any).date,
            });
            break;
          case 'grocery_items':
            await db.insert(groceryItems).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              isChecked: (record as any).is_checked,
            });
            break;
          case 'rewards':
            await db.insert(rewards).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              imageUrl: (record as any).image_url,
            });
            break;
          case 'reward_claims':
            await db.insert(rewardClaims).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rewardId: (record as any).reward_id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              userId: (record as any).user_id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pointsCost: (record as any).points_cost,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              claimedAt: (record as any).claimed_at ? new Date((record as any).claimed_at) : new Date(),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              unclaimedAt: (record as any).unclaimed_at ? new Date((record as any).unclaimed_at) : null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              unclaimedBy: (record as any).unclaimed_by,
            });
            break;
          case 'lists':
            await db.insert(lists).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
            });
            break;
          case 'list_items':
            await db.insert(listItems).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              listId: (record as any).list_id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              isChecked: (record as any).is_checked,
            });
            break;
          case 'recipes':
            await db.insert(recipes).values({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(record as any),
              familyId,
            });
            break;
        }
      }

      // Handle updated records
      for (const record of tableChanges.updated || []) {
        if (!record) continue;

        switch (tableName) {
          case 'families': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('name' in record) update.name = record.name;
            if ('kiosk_timeout_seconds' in record) update.kioskTimeoutSeconds = record.kiosk_timeout_seconds;
            await db.update(families).set(update).where(eq(families.id, record.id));
            break;
          }
          case 'users': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('name' in record) update.name = record.name;
            if ('role' in record) update.role = record.role;
            if ('pin_hash' in record) update.pinHash = record.pin_hash;
            if ('points_balance' in record) update.pointsBalance = record.points_balance;
            if ('email_frequency' in record) update.emailFrequency = record.email_frequency;
            if ('avatar_url' in record) update.avatarUrl = record.avatar_url;
            await db.update(users).set(update).where(eq(users.id, record.id));
            break;
          }
          case 'notifications': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('title' in record) update.title = record.title;
            if ('message' in record) update.message = record.message;
            if ('type' in record) update.type = record.type;
            if ('is_read' in record) update.isRead = record.is_read;
            await db.update(notifications).set(update).where(eq(notifications.id, record.id));
            break;
          }
          case 'tasks': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('title' in record) update.title = record.title;
            if ('description' in record) update.description = record.description;
            if ('points' in record) update.points = record.points;
            if ('status' in record) update.status = record.status;
            if ('due_date' in record) update.dueDate = record.due_date ? new Date(record.due_date as string) : null;
            if ('recurrence_rule' in record) update.recurrenceRule = record.recurrence_rule;
            if ('assignee_id' in record) update.assigneeId = record.assignee_id;
            if ('creator_id' in record) update.creatorId = record.creator_id;

            // Point Awarding Logic
            // If status is changing to COMPLETED, award points to the assignee
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ('status' in record && (record as any).status === 'COMPLETED') {
              const [currentTask] = await db.select().from(tasks).where(eq(tasks.id, record.id));
              
              // Only award if not already completed
              if (currentTask && currentTask.status !== 'COMPLETED') {
                // Use new values if present in update, otherwise use existing
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const points = 'points' in record ? Number((record as any).points) : currentTask.points;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assigneeId = 'assignee_id' in record ? (record as any).assignee_id : currentTask.assigneeId;

                if (assigneeId && points > 0) {
                  const [assignee] = await db.select().from(users).where(eq(users.id, assigneeId));
                  if (assignee) {
                    await db.update(users)
                      .set({ 
                        pointsBalance: assignee.pointsBalance + points,
                        updatedAt: new Date()
                      })
                      .where(eq(users.id, assigneeId));
                  }
                }
              }
            }

            await db.update(tasks).set(update).where(eq(tasks.id, record.id));
            break;
          }
          case 'events': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('title' in record) update.title = record.title;
            if ('start_time' in record) update.startTime = new Date(record.start_time as string);
            if ('end_time' in record) update.endTime = new Date(record.end_time as string);
            if ('recurrence_rule' in record) update.recurrenceRule = record.recurrence_rule;
            await db.update(events).set(update).where(eq(events.id, record.id));
            break;
          }
          case 'meal_plans': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('date' in record) update.date = record.date;
            if ('meal_type' in record) update.mealType = record.meal_type;
            if ('description' in record) update.description = record.description;
            await db.update(mealPlans).set(update).where(eq(mealPlans.id, record.id));
            break;
          }
          case 'grocery_items': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('name' in record) update.name = record.name;
            if ('is_checked' in record) update.isChecked = record.is_checked;
            await db.update(groceryItems).set(update).where(eq(groceryItems.id, record.id));
            break;
          }
          case 'rewards': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('title' in record) update.title = record.title;
            if ('cost' in record) update.cost = record.cost;
            if ('image_url' in record) update.imageUrl = record.image_url;
            await db.update(rewards).set(update).where(eq(rewards.id, record.id));
            break;
          }
          case 'reward_claims': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('status' in record) update.status = record.status;
            if ('unclaimed_at' in record) update.unclaimedAt = record.unclaimed_at ? new Date(record.unclaimed_at as string) : null;
            if ('unclaimed_by' in record) update.unclaimedBy = record.unclaimed_by;
            await db.update(rewardClaims).set(update).where(eq(rewardClaims.id, record.id));
            break;
          }
          case 'lists': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('name' in record) update.name = record.name;
            if ('type' in record) update.type = record.type;
            await db.update(lists).set(update).where(eq(lists.id, record.id));
            break;
          }
          case 'list_items': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('text' in record) update.text = record.text;
            if ('is_checked' in record) update.isChecked = record.is_checked;
            if ('list_id' in record) update.listId = record.list_id;
            await db.update(listItems).set(update).where(eq(listItems.id, record.id));
            break;
          }
          case 'recipes': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update: any = { updatedAt: new Date() };
            if ('name' in record) update.name = record.name;
            if ('description' in record) update.description = record.description;
            if ('ingredients' in record) update.ingredients = record.ingredients;
            if ('instructions' in record) update.instructions = record.instructions;
            await db.update(recipes).set(update).where(eq(recipes.id, record.id));
            break;
          }
        }
      }

      // Handle deleted records
      if (tableChanges.deleted && tableChanges.deleted.length > 0) {
        switch (tableName) {
          case 'families':
            await db.delete(families).where(inArray(families.id, tableChanges.deleted));
            break;
          case 'users':
            await db.delete(users).where(inArray(users.id, tableChanges.deleted));
            break;
          case 'notifications':
            await db.delete(notifications).where(inArray(notifications.id, tableChanges.deleted));
            break;
          case 'tasks':
            await db.delete(tasks).where(inArray(tasks.id, tableChanges.deleted));
            break;
          case 'events':
            await db.delete(events).where(inArray(events.id, tableChanges.deleted));
            break;
          case 'meal_plans':
            await db.delete(mealPlans).where(inArray(mealPlans.id, tableChanges.deleted));
            break;
          case 'grocery_items':
            await db.delete(groceryItems).where(inArray(groceryItems.id, tableChanges.deleted));
            break;
          case 'rewards':
            await db.delete(rewards).where(inArray(rewards.id, tableChanges.deleted));
            break;
          case 'reward_claims':
            await db.delete(rewardClaims).where(inArray(rewardClaims.id, tableChanges.deleted));
            break;
          case 'lists':
            await db.delete(lists).where(inArray(lists.id, tableChanges.deleted));
            break;
          case 'list_items':
            await db.delete(listItems).where(inArray(listItems.id, tableChanges.deleted));
            break;
          case 'recipes':
            await db.delete(recipes).where(inArray(recipes.id, tableChanges.deleted));
            break;
        }
      }
    }

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.status(500).send({ error: `Sync push failed: ${errorMessage}` });
  }
}
