import { Database } from '@nozbe/watermelondb';
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
 * Delete a single event (for non-recurring events or single instance deletion)
 */
export async function deleteEvent(database: Database, eventId: string) {
  await database.write(async () => {
    const event = await database.get<Event>('events').find(eventId);
    await event.markAsDeleted();
  });
}

/**
 * Delete recurring event with options (calls backend API)
 * @param eventId - The ID of the event to delete
 * @param deleteType - 'single' | 'all' | 'future'
 * @param apiBaseUrl - Base URL for the backend API
 * @param token - Authentication token
 */
export async function deleteRecurringEvent(
  eventId: string,
  deleteType: DeleteEventType,
  apiBaseUrl: string,
  token: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const response = await fetch(`${apiBaseUrl}/events/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ eventId, deleteType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        deletedCount: 0, 
        error: errorData.error || 'Failed to delete event' 
      };
    }

    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Network error' 
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
