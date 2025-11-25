import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { Event } from '../model/models';

export interface CreateEventParams {
  title: string;
  startTime: Date;
  endTime: Date;
  familyId: string;
  recurrenceRule?: string;
  isAllDay?: boolean;
}

export interface RecurrenceOptions {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  count?: number;
  until?: Date;
  byDay?: ('SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA')[];
  byMonthDay?: number;
  byMonth?: number;
}

export type DeleteEventType = 'single' | 'all' | 'future';

/**
 * Build a recurrence rule string from options
 * Example: buildRecurrenceRule({ frequency: 'WEEKLY', byDay: ['MO', 'WE', 'FR'], count: 10 })
 * Returns: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10"
 */
export function buildRecurrenceRule(options: RecurrenceOptions): string {
  const parts: string[] = [`FREQ=${options.frequency}`];
  
  if (options.interval && options.interval > 1) {
    parts.push(`INTERVAL=${options.interval}`);
  }
  
  if (options.byDay && options.byDay.length > 0) {
    parts.push(`BYDAY=${options.byDay.join(',')}`);
  }
  
  if (options.byMonth) {
    parts.push(`BYMONTH=${options.byMonth}`);
  }
  
  if (options.byMonthDay) {
    parts.push(`BYMONTHDAY=${options.byMonthDay}`);
  }
  
  if (options.count) {
    parts.push(`COUNT=${options.count}`);
  }
  
  if (options.until) {
    // Format as YYYYMMDDTHHMMSSZ for iCalendar compatibility
    const year = options.until.getUTCFullYear();
    const month = String(options.until.getUTCMonth() + 1).padStart(2, '0');
    const day = String(options.until.getUTCDate()).padStart(2, '0');
    const hours = String(options.until.getUTCHours()).padStart(2, '0');
    const minutes = String(options.until.getUTCMinutes()).padStart(2, '0');
    const seconds = String(options.until.getUTCSeconds()).padStart(2, '0');
    const formattedDate = `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    parts.push(`UNTIL=${formattedDate}`);
  }
  
  return parts.join(';');
}

/**
 * Create a single event (one-time or recurring)
 * For recurring events, the recurrenceRule should be provided in iCalendar RRULE format
 * The backend will generate all recurring instances when this event is synced
 */
export async function createEvent(database: Database, params: CreateEventParams) {
  await database.write(async () => {
    await database.get<Event>('events').create((event) => {
      event.title = params.title;
      event.startTime = params.startTime;
      event.endTime = params.endTime;
      event.familyId = params.familyId;
      event.isAllDay = params.isAllDay || false;
      if (params.recurrenceRule) {
        event.recurrenceRule = params.recurrenceRule;
      }
    });
  });
}

export async function updateEvent(database: Database, eventId: string, params: Partial<CreateEventParams>) {
  await database.write(async () => {
    const event = await database.get<Event>('events').find(eventId);
    await event.update((e) => {
      if (params.title) e.title = params.title;
      if (params.startTime) e.startTime = params.startTime;
      if (params.endTime) e.endTime = params.endTime;
      if (params.recurrenceRule !== undefined) e.recurrenceRule = params.recurrenceRule;
      if (params.isAllDay !== undefined) e.isAllDay = params.isAllDay;
    });
  });
}

/**
 * Delete a single event instance
 * This marks the event as deleted in WatermelonDB which will sync to backend
 */
export async function deleteEvent(database: Database, eventId: string) {
  await database.write(async () => {
    const event = await database.get<Event>('events').find(eventId);
    await event.markAsDeleted();
  });
}

/**
 * Delete recurring events based on delete type
 * All deletions happen through WatermelonDB and sync to backend via push/pull
 * 
 * @param database - WatermelonDB database instance
 * @param eventId - The ID of the event to start deletion from
 * @param deleteType - 'single' | 'all' | 'future'
 */
export async function deleteRecurringEvent(
  database: Database,
  eventId: string,
  deleteType: DeleteEventType
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const event = await database.get<Event>('events').find(eventId);
    
    if (!event) {
      return { success: false, deletedCount: 0, error: 'Event not found' };
    }

    let deletedCount = 0;

    await database.write(async () => {
      switch (deleteType) {
        case 'single':
          // Delete only this instance
          await event.markAsDeleted();
          deletedCount = 1;
          break;

        case 'all':
          // Delete all instances with the same recurrence_id
          if (event.recurrenceId) {
            const allEvents = await database
              .get<Event>('events')
              .query(Q.where('recurrence_id', event.recurrenceId))
              .fetch();
            
            for (const e of allEvents) {
              await e.markAsDeleted();
            }
            deletedCount = allEvents.length;
          } else {
            // Non-recurring event, just delete this one
            await event.markAsDeleted();
            deletedCount = 1;
          }
          break;

        case 'future':
          // Delete this and all future instances
          if (event.recurrenceId) {
            const eventStartTime = event.startTime.getTime();
            const futureEvents = await database
              .get<Event>('events')
              .query(
                Q.and(
                  Q.where('recurrence_id', event.recurrenceId),
                  Q.where('start_time', Q.gte(eventStartTime))
                )
              )
              .fetch();
            
            for (const e of futureEvents) {
              await e.markAsDeleted();
            }
            deletedCount = futureEvents.length;
          } else {
            // Non-recurring event, just delete this one
            await event.markAsDeleted();
            deletedCount = 1;
          }
          break;
      }
    });

    return { success: true, deletedCount };
  } catch (error) {
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if an event is part of a recurring series
 * 
 * Events can be recurring in two ways:
 * - recurrenceRule: The original event with the RRULE (before sync)
 * - recurrenceId: A generated instance that's part of a series (after sync)
 * 
 * After syncing, backend replaces the single event with multiple instances
 * that share the same recurrenceId but each has the recurrenceRule preserved.
 */
export function isRecurringEvent(event: Event): boolean {
  return !!(event.recurrenceRule || event.recurrenceId);
}
