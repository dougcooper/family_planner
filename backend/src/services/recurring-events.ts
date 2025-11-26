import { db } from '../db/index.js';
import { events } from '../db/schema.js';
import { eq, and, gte, lte, desc, isNotNull } from 'drizzle-orm';
import rrule from 'rrule';
import { logger } from '../logger.js';
const { RRule, rrulestr } = rrule;

/**
 * Recurring Events Service
 * 
 * This service handles the creation and management of recurring events.
 * It generates event instances based on recurrence rules in iCalendar RRULE format.
 * 
 * Supported recurrence patterns:
 * - FREQ=DAILY: Daily events
 * - FREQ=WEEKLY;BYDAY=MO,WE,FR: Weekly on specific days
 * - FREQ=MONTHLY;BYMONTHDAY=15: Monthly on specific day of month
 * - FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25: Yearly on specific date
 * 
 * COUNT and UNTIL parameters are supported to limit occurrences.
 */

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number; // e.g., every 2 weeks
  count?: number; // number of occurrences
  until?: Date; // end date
  byDay?: string[]; // for WEEKLY: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonthDay?: number; // for MONTHLY: day of month (1-31)
  byMonth?: number; // for YEARLY: month (1-12)
}

export interface CreateRecurringEventParams {
  familyId: string;
  userId?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  recurrenceRule?: string; // iCalendar RRULE format
}

export interface RecurringEventInstance {
  id: string;
  familyId: string;
  userId?: string | null;
  title: string;
  startTime: Date;
  endTime: Date;
  recurrenceRule?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parse a recurrence rule string (simplified iCalendar RRULE format)
 * Example: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10"
 */
export function parseRecurrenceRule(rrule: string): RecurrenceRule | null {
  if (!rrule || !rrule.trim()) return null;

  try {
    // Use rrule library to parse string directly to avoid defaults
    const options = RRule.parseString(rrule);
    
    if (options.freq === undefined || options.freq === null) return null;

    const freqMap = ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'HOURLY', 'MINUTELY', 'SECONDLY'];
    
    const result: RecurrenceRule = {
      frequency: freqMap[options.freq] as RecurrenceRule['frequency'],
    };

    if (options.interval) result.interval = options.interval;
    if (options.count) result.count = options.count;
    if (options.until) result.until = options.until;
    
    if (options.byweekday) {
      // Handle array of Weekday objects or numbers (though parseString usually returns Weekday objects)
      const days = Array.isArray(options.byweekday) ? options.byweekday : [options.byweekday];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.byDay = days.map((d: any) => {
        const dayIndex = typeof d === 'number' ? d : d.weekday;
        return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][dayIndex];
      });
    }

    if (options.bymonthday) {
      result.byMonthDay = Array.isArray(options.bymonthday) ? options.bymonthday[0] : options.bymonthday;
    }

    if (options.bymonth) {
      result.byMonth = Array.isArray(options.bymonth) ? options.bymonth[0] : options.bymonth;
    }

    return result;
  } catch (e) {
    logger.error({ err: e }, 'Error parsing recurrence rule');
    return null;
  }
}

/**
 * Generate event instances for a given time range
 */
export function generateEventInstances(
  baseEvent: CreateRecurringEventParams,
  startDate: Date,
  endDate: Date,
  maxInstances = 100
): Array<Omit<RecurringEventInstance, 'id' | 'createdAt' | 'updatedAt'>> {
  if (!baseEvent.recurrenceRule) {
    // Non-recurring event - return single instance if in range
    if (baseEvent.startTime >= startDate && baseEvent.startTime <= endDate) {
      return [{
        familyId: baseEvent.familyId,
        userId: baseEvent.userId,
        title: baseEvent.title,
        startTime: baseEvent.startTime,
        endTime: baseEvent.endTime,
        recurrenceRule: undefined,
      }];
    }
    return [];
  }

  try {
    // Parse the RRULE string
    // Note: rrulestr expects standard iCalendar format.
    // If our string is simplified, we might need to adjust it, but standard format is preferred.
    // The frontend buildRecurrenceRule produces standard format.
    
    // We need to set the start date (dtstart) for the rule
    const rule = rrulestr(baseEvent.recurrenceRule, {
      dtstart: baseEvent.startTime
    });

    // Get all occurrences between startDate and endDate
    // We add a buffer to maxInstances to ensure we get enough candidates
    const dates = rule.between(startDate, endDate, true, (date, i) => i < maxInstances);

    const eventDuration = baseEvent.endTime.getTime() - baseEvent.startTime.getTime();

    return dates.map(date => ({
      familyId: baseEvent.familyId,
      userId: baseEvent.userId,
      title: baseEvent.title,
      startTime: date,
      endTime: new Date(date.getTime() + eventDuration),
      recurrenceRule: baseEvent.recurrenceRule,
    }));

  } catch (error) {
    logger.error({ err: error }, 'Error generating event instances with rrule');
    return [];
  }
}

// Removed manual helper functions (shouldIncludeDate, getNextOccurrence) as we use rrule lib now

/**
 * Create a recurring event and generate its instances for a given time range
 */
export const DEFAULT_GENERATION_DAYS = 90; // Default to generate instances for next 3 months
export const TOP_UP_THRESHOLD_DAYS = 180; // Check if we have less than 6 months of events
export const TOP_UP_HORIZON_DAYS = 365; // Top up to 1 year

export async function createRecurringEvent(
  params: CreateRecurringEventParams,
  generateUntil?: Date
): Promise<{ success: boolean; eventIds: string[]; error?: string }> {
  try {
    // Default generate instances for next 3 months if not specified
    const until = generateUntil || new Date(Date.now() + DEFAULT_GENERATION_DAYS * 24 * 60 * 60 * 1000);
    
    // Generate event instances
    const instances = generateEventInstances(
      params,
      params.startTime,
      until,
      100 // max 100 instances to prevent abuse
    );

    if (instances.length === 0) {
      return { 
        success: false, 
        eventIds: [], 
        error: 'No event instances generated' 
      };
    }

    // Insert all instances into database
    const insertedEvents = await db
      .insert(events)
      .values(
        instances.map(instance => ({
          familyId: instance.familyId,
          title: instance.title,
          startTime: instance.startTime,
          endTime: instance.endTime,
          recurrenceRule: instance.recurrenceRule,
        }))
      )
      .returning();

    return {
      success: true,
      eventIds: insertedEvents.map(e => e.id),
    };
  } catch (error) {
    logger.error({ err: error }, 'Error creating recurring event');
    return {
      success: false,
      eventIds: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process recurring events top-up
 * This function should be called periodically (e.g. nightly) to ensure
 * infinite recurring events continue to be generated into the future.
 */
export async function processRecurringEventsTopUp(): Promise<{ success: boolean; processedCount: number; error?: string }> {
  try {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + TOP_UP_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    const horizonDate = new Date(now.getTime() + TOP_UP_HORIZON_DAYS * 24 * 60 * 60 * 1000);
    let processedCount = 0;

    // 1. Get all distinct recurrenceIds
    const distinctRecurrences = await db
      .selectDistinct({ recurrenceId: events.recurrenceId })
      .from(events)
      .where(isNotNull(events.recurrenceId));

    for (const { recurrenceId } of distinctRecurrences) {
      if (!recurrenceId) continue;

      // 2. Get the latest instance for this recurrenceId
      const [latestInstance] = await db
        .select()
        .from(events)
        .where(eq(events.recurrenceId, recurrenceId))
        .orderBy(desc(events.startTime))
        .limit(1);

      if (!latestInstance) continue;

      // 3. Check if we need to top up
      if (latestInstance.startTime < thresholdDate) {
        // 4. Check if the rule allows for more instances (infinite)
        const rule = parseRecurrenceRule(latestInstance.recurrenceRule || '');
        if (!rule) continue;

        // Only top up infinite events (no COUNT and no UNTIL)
        if (!rule.count && !rule.until) {
          // Generate from just after the latest instance
          const generationStartDate = new Date(latestInstance.startTime.getTime() + 1000);
          
          // Use the latest instance as the base for generation
          // Note: This assumes the latest instance is "on grid" with the recurrence pattern.
          // If the latest instance was moved (exception), this might shift future events.
          // A more robust solution would be to find the original start event of the series.
          const newInstances = generateEventInstances(
            {
              familyId: latestInstance.familyId,
              userId: latestInstance.userId || undefined,
              title: latestInstance.title,
              startTime: latestInstance.startTime,
              endTime: latestInstance.endTime,
              recurrenceRule: latestInstance.recurrenceRule || undefined,
            },
            generationStartDate,
            horizonDate,
            365 // max instances to generate in this batch
          );
          
          if (newInstances.length > 0) {
             await db.insert(events).values(
               newInstances.map(instance => ({
                 familyId: instance.familyId,
                 userId: instance.userId,
                 title: instance.title,
                 startTime: instance.startTime,
                 endTime: instance.endTime,
                 recurrenceRule: instance.recurrenceRule,
                 recurrenceId: recurrenceId,
                 isAllDay: latestInstance.isAllDay,
               }))
             );
             processedCount++;
          }
        }
      }
    }

    return { success: true, processedCount };
  } catch (error) {
    logger.error({ err: error }, 'Error processing recurring events top-up');
    return {
      success: false,
      processedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a recurring event series
 * This will update all future instances of the event
 */
export async function updateRecurringEvent(
  eventId: string,
  updates: Partial<CreateRecurringEventParams>
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    // Get the original event
    const [originalEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!originalEvent || !originalEvent.recurrenceRule) {
      return {
        success: false,
        updatedCount: 0,
        error: 'Event not found or not a recurring event',
      };
    }

    // Update all future instances with the same recurrence rule
    const now = new Date();
    const result = await db
      .update(events)
      .set({
        title: updates.title || originalEvent.title,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(events.recurrenceRule, originalEvent.recurrenceRule),
          eq(events.familyId, originalEvent.familyId),
          gte(events.startTime, now)
        )
      )
      .returning();

    return {
      success: true,
      updatedCount: result.length,
    };
  } catch (error) {
    logger.error({ err: error }, 'Error updating recurring event');
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a recurring event series
 * This will delete all future instances of the event
 */
export async function deleteRecurringEvent(
  eventId: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    // Get the original event
    const [originalEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!originalEvent || !originalEvent.recurrenceRule) {
      return {
        success: false,
        deletedCount: 0,
        error: 'Event not found or not a recurring event',
      };
    }

    // Delete all future instances with the same recurrence rule
    const now = new Date();
    const result = await db
      .delete(events)
      .where(
        and(
          eq(events.recurrenceRule, originalEvent.recurrenceRule),
          eq(events.familyId, originalEvent.familyId),
          gte(events.startTime, now)
        )
      )
      .returning();

    return {
      success: true,
      deletedCount: result.length,
    };
  } catch (error) {
    logger.error({ err: error }, 'Error deleting recurring event');
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all event instances for a family within a date range
 */
export async function getEventInstances(
  familyId: string,
  startDate: Date,
  endDate: Date
): Promise<RecurringEventInstance[]> {
  try {
    const eventInstances = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.familyId, familyId),
          gte(events.startTime, startDate),
          lte(events.startTime, endDate)
        )
      );

    return eventInstances;
  } catch (error) {
    logger.error({ err: error }, 'Error getting event instances');
    return [];
  }
}
