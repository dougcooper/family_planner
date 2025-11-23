import { Database } from '@nozbe/watermelondb';
import { Event } from '../model/models';

export interface CreateEventParams {
  title: string;
  startTime: Date;
  endTime: Date;
  familyId: string;
  recurrenceRule?: string;
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
    parts.push(`UNTIL=${options.until.toISOString()}`);
  }
  
  return parts.join(';');
}

/**
 * Create a single event (one-time or recurring)
 * For recurring events, the recurrenceRule should be provided in iCalendar RRULE format
 */
export async function createEvent(database: Database, params: CreateEventParams) {
  await database.write(async () => {
    await database.get<Event>('events').create((event) => {
      event.title = params.title;
      event.startTime = params.startTime;
      event.endTime = params.endTime;
      event.familyId = params.familyId;
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
    });
  });
}

export async function deleteEvent(database: Database, eventId: string) {
  await database.write(async () => {
    const event = await database.get<Event>('events').find(eventId);
    await event.markAsDeleted();
  });
}
