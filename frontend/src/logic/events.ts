import { Database } from '@nozbe/watermelondb';
import { Event } from '../model/models';

export interface CreateEventParams {
  title: string;
  startTime: Date;
  endTime: Date;
  familyId: string;
  recurrenceRule?: string;
}

export async function createEvent(database: Database, params: CreateEventParams) {
  await database.write(async () => {
    await database.get<Event>('events').create((event) => {
      event.title = params.title;
      event.startTime = params.startTime;
      event.endTime = params.endTime;
      event.familyId = params.familyId;
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
