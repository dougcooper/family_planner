import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { users, notifications, tasks, events, mealPlans, groceryItems, rewards, families } from '../db/schema.js';
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
