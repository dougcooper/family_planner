import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { events } from '../db/schema.js';
import { eq, and, gte } from 'drizzle-orm';

export interface DeleteRecurringEventBody {
  eventId: string;
  deleteType: 'single' | 'all' | 'future';
}

/**
 * Delete a recurring event with options:
 * - single: Delete only the specified instance
 * - all: Delete all instances in the recurring series
 * - future: Delete this and all future instances
 */
export async function deleteRecurringEvent(
  request: FastifyRequest<{ Body: DeleteRecurringEventBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-expect-error - familyId set by auth middleware
    const { familyId } = request.user;
    const { eventId, deleteType } = request.body;

    // Get the event to be deleted
    const [eventToDelete] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.familyId, familyId)));

    if (!eventToDelete) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    let deletedCount = 0;

    switch (deleteType) {
      case 'single':
        // Delete only this instance
        await db.delete(events).where(eq(events.id, eventId));
        deletedCount = 1;
        break;

      case 'all':
        // Delete all instances with the same recurrence_id
        if (eventToDelete.recurrenceId) {
          const result = await db
            .delete(events)
            .where(
              and(
                eq(events.recurrenceId, eventToDelete.recurrenceId),
                eq(events.familyId, familyId)
              )
            )
            .returning();
          deletedCount = result.length;
        } else {
          // Non-recurring event, just delete this one
          await db.delete(events).where(eq(events.id, eventId));
          deletedCount = 1;
        }
        break;

      case 'future':
        // Delete this and all future instances
        if (eventToDelete.recurrenceId) {
          const result = await db
            .delete(events)
            .where(
              and(
                eq(events.recurrenceId, eventToDelete.recurrenceId),
                eq(events.familyId, familyId),
                gte(events.startTime, eventToDelete.startTime)
              )
            )
            .returning();
          deletedCount = result.length;
        } else {
          // Non-recurring event, just delete this one
          await db.delete(events).where(eq(events.id, eventId));
          deletedCount = 1;
        }
        break;

      default:
        return reply.status(400).send({ error: 'Invalid delete type' });
    }

    return reply.send({ 
      success: true, 
      deletedCount,
      message: `Deleted ${deletedCount} event instance(s)` 
    });
  } catch (error) {
    request.log.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.status(500).send({ error: `Failed to delete event: ${errorMessage}` });
  }
}

export interface GetRecurringSeriesParams {
  eventId: string;
}

/**
 * Get all events in a recurring series
 */
export async function getRecurringSeries(
  request: FastifyRequest<{ Params: GetRecurringSeriesParams }>,
  reply: FastifyReply
) {
  try {
    // @ts-expect-error - familyId set by auth middleware
    const { familyId } = request.user;
    const { eventId } = request.params;

    // Get the event
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.familyId, familyId)));

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    if (!event.recurrenceId) {
      // Non-recurring event, return just this one
      return reply.send({ events: [event], isRecurring: false });
    }

    // Get all events in the series
    const seriesEvents = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.recurrenceId, event.recurrenceId),
          eq(events.familyId, familyId)
        )
      );

    return reply.send({ 
      events: seriesEvents, 
      isRecurring: true,
      recurrenceId: event.recurrenceId,
      recurrenceRule: event.recurrenceRule,
      totalCount: seriesEvents.length
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to get recurring series' });
  }
}
