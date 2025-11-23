import { db } from '../db/index.js';
import { events } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';

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
  title: string;
  startTime: Date;
  endTime: Date;
  recurrenceRule?: string; // iCalendar RRULE format
}

export interface RecurringEventInstance {
  id: string;
  familyId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  recurrenceRule?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parse a recurrence rule string (simplified iCalendar RRULE format)
 * Example: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10"
 */
export function parseRecurrenceRule(rrule: string): RecurrenceRule | null {
  if (!rrule) return null;

  const parts = rrule.split(';');
  const rule: Partial<RecurrenceRule> = {};

  for (const part of parts) {
    const [key, value] = part.split('=');
    
    switch (key) {
      case 'FREQ':
        if (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(value)) {
          rule.frequency = value as RecurrenceRule['frequency'];
        }
        break;
      case 'INTERVAL':
        rule.interval = parseInt(value, 10);
        break;
      case 'COUNT':
        rule.count = parseInt(value, 10);
        break;
      case 'UNTIL':
        rule.until = new Date(value);
        break;
      case 'BYDAY':
        rule.byDay = value.split(',');
        break;
      case 'BYMONTHDAY':
        rule.byMonthDay = parseInt(value, 10);
        break;
      case 'BYMONTH':
        rule.byMonth = parseInt(value, 10);
        break;
    }
  }

  return rule.frequency ? rule as RecurrenceRule : null;
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
        title: baseEvent.title,
        startTime: baseEvent.startTime,
        endTime: baseEvent.endTime,
        recurrenceRule: undefined,
      }];
    }
    return [];
  }

  const rule = parseRecurrenceRule(baseEvent.recurrenceRule);
  if (!rule) return [];

  const instances: Array<Omit<RecurringEventInstance, 'id' | 'createdAt' | 'updatedAt'>> = [];
  const eventDuration = baseEvent.endTime.getTime() - baseEvent.startTime.getTime();
  
  let currentDate = new Date(baseEvent.startTime);
  const interval = rule.interval || 1;
  let count = 0;
  const maxCount = rule.count || maxInstances;
  const untilDate = rule.until || endDate;

  while (count < maxCount && currentDate <= untilDate && currentDate <= endDate) {
    if (currentDate >= startDate && shouldIncludeDate(currentDate, rule)) {
      const instanceStartTime = new Date(currentDate);
      const instanceEndTime = new Date(currentDate.getTime() + eventDuration);
      
      instances.push({
        familyId: baseEvent.familyId,
        title: baseEvent.title,
        startTime: instanceStartTime,
        endTime: instanceEndTime,
        recurrenceRule: baseEvent.recurrenceRule,
      });
      count++;
    }

    // Advance to next occurrence
    currentDate = getNextOccurrence(currentDate, rule, interval);
    
    // Safety check to prevent infinite loops
    if (count >= maxInstances) break;
  }

  return instances;
}

/**
 * Check if a date should be included based on the recurrence rule
 */
function shouldIncludeDate(date: Date, rule: RecurrenceRule): boolean {
  // Check BYDAY for weekly recurrence
  if (rule.frequency === 'WEEKLY' && rule.byDay && rule.byDay.length > 0) {
    const dayMap: { [key: string]: number } = {
      'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
    };
    const dayOfWeek = date.getDay();
    const matchesDay = rule.byDay.some(day => dayMap[day] === dayOfWeek);
    if (!matchesDay) return false;
  }

  // Check BYMONTHDAY for monthly recurrence
  if (rule.frequency === 'MONTHLY' && rule.byMonthDay) {
    if (date.getDate() !== rule.byMonthDay) return false;
  }

  // Check BYMONTH for yearly recurrence
  if (rule.frequency === 'YEARLY' && rule.byMonth) {
    if (date.getMonth() + 1 !== rule.byMonth) return false;
  }

  // Check BYMONTHDAY for yearly recurrence
  if (rule.frequency === 'YEARLY' && rule.byMonthDay) {
    if (date.getDate() !== rule.byMonthDay) return false;
  }

  return true;
}

/**
 * Get the next occurrence date based on the recurrence rule
 */
function getNextOccurrence(date: Date, rule: RecurrenceRule, interval: number): Date {
  const next = new Date(date);

  switch (rule.frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + interval);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + (7 * interval));
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  return next;
}

/**
 * Create a recurring event and generate its instances for a given time range
 */
export async function createRecurringEvent(
  params: CreateRecurringEventParams,
  generateUntil?: Date
): Promise<{ success: boolean; eventIds: string[]; error?: string }> {
  try {
    // Default generate instances for next 3 months if not specified
    const until = generateUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    
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
    console.error('Error creating recurring event:', error);
    return {
      success: false,
      eventIds: [],
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
    console.error('Error updating recurring event:', error);
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
    console.error('Error deleting recurring event:', error);
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
    console.error('Error getting event instances:', error);
    return [];
  }
}
