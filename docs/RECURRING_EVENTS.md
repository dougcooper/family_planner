# Recurring Events Service

## Overview

This feature adds support for creating and managing recurring events in the Family Planner application. Events can now repeat on a daily, weekly, monthly, or yearly basis using iCalendar RRULE format.

## Features

### Backend Service

The recurring events service (`backend/src/services/recurring-events.ts`) provides:

- **Recurrence Rule Parsing**: Parse iCalendar RRULE format strings
- **Event Instance Generation**: Generate event instances based on recurrence rules
- **Batch Creation**: Create multiple event instances at once
- **Series Management**: Update or delete entire recurring event series

### Frontend Support

The frontend implementation includes:

- **Recurrence Rule Builder**: Helper function to build RRULE strings from options
- **UI Components**: Updated CreateEventModal with recurring event controls
- **Event Creation**: Support for creating both one-time and recurring events

## Usage

### Backend API

#### Creating Recurring Events

```typescript
import { createRecurringEvent } from './services/recurring-events';

// Create a weekly recurring event
const result = await createRecurringEvent({
  familyId: 'family-123',
  title: 'Weekly Team Meeting',
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T11:00:00Z'),
  recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=10'
});

if (result.success) {
  console.log(`Created ${result.eventIds.length} event instances`);
}
```

#### Generating Event Instances

```typescript
import { generateEventInstances } from './services/recurring-events';

const instances = generateEventInstances(
  {
    familyId: 'family-123',
    title: 'Daily Standup',
    startTime: new Date('2024-01-01T09:00:00Z'),
    endTime: new Date('2024-01-01T09:30:00Z'),
    recurrenceRule: 'FREQ=DAILY;COUNT=5'
  },
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

console.log(`Generated ${instances.length} instances`);
```

#### Updating Recurring Event Series

```typescript
import { updateRecurringEvent } from './services/recurring-events';

// Update all future instances
const result = await updateRecurringEvent('event-123', {
  title: 'Updated Meeting Title'
});

console.log(`Updated ${result.updatedCount} events`);
```

#### Deleting Recurring Event Series

```typescript
import { deleteRecurringEvent } from './services/recurring-events';

// Delete all future instances
const result = await deleteRecurringEvent('event-123');

console.log(`Deleted ${result.deletedCount} events`);
```

### Frontend API

#### Building Recurrence Rules

```typescript
import { buildRecurrenceRule } from './logic/events';

// Daily recurrence
const daily = buildRecurrenceRule({
  frequency: 'DAILY',
  count: 30
});
// Result: "FREQ=DAILY;COUNT=30"

// Weekly on specific days
const weekly = buildRecurrenceRule({
  frequency: 'WEEKLY',
  byDay: ['MO', 'WE', 'FR'],
  count: 12
});
// Result: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12"

// Monthly on specific day
const monthly = buildRecurrenceRule({
  frequency: 'MONTHLY',
  byMonthDay: 15,
  count: 12
});
// Result: "FREQ=MONTHLY;BYMONTHDAY=15;COUNT=12"

// Yearly on specific date
const yearly = buildRecurrenceRule({
  frequency: 'YEARLY',
  byMonth: 12,
  byMonthDay: 25,
  count: 5
});
// Result: "FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25;COUNT=5"
```

#### Creating Events with Recurrence

```typescript
import { createEvent, buildRecurrenceRule } from './logic/events';

await createEvent(database, {
  familyId: 'family-123',
  title: 'Weekly Review',
  startTime: new Date('2024-01-01T15:00:00Z'),
  endTime: new Date('2024-01-01T16:00:00Z'),
  recurrenceRule: buildRecurrenceRule({
    frequency: 'WEEKLY',
    interval: 2, // Every 2 weeks
    count: 10
  })
});
```

## Recurrence Rule Format

The service uses iCalendar RRULE format with the following supported parameters:

### Frequency (Required)
- `FREQ=DAILY` - Daily recurrence
- `FREQ=WEEKLY` - Weekly recurrence
- `FREQ=MONTHLY` - Monthly recurrence
- `FREQ=YEARLY` - Yearly recurrence

### Optional Parameters

- **INTERVAL**: How often the recurrence repeats
  - Example: `INTERVAL=2` with `FREQ=WEEKLY` means every 2 weeks
  
- **COUNT**: Number of occurrences
  - Example: `COUNT=10` generates 10 instances
  
- **UNTIL**: End date for recurrence
  - Example: `UNTIL=2024-12-31T23:59:59Z`
  
- **BYDAY**: Days of the week (for WEEKLY)
  - Values: `SU`, `MO`, `TU`, `WE`, `TH`, `FR`, `SA`
  - Example: `BYDAY=MO,WE,FR`
  
- **BYMONTHDAY**: Day of month (for MONTHLY/YEARLY)
  - Values: 1-31
  - Example: `BYMONTHDAY=15`
  
- **BYMONTH**: Month of year (for YEARLY)
  - Values: 1-12
  - Example: `BYMONTH=12`

### Examples

```
# Daily for 30 days
FREQ=DAILY;COUNT=30

# Weekly on Monday, Wednesday, Friday for 12 weeks
FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12

# Bi-weekly on Tuesdays for 10 occurrences
FREQ=WEEKLY;INTERVAL=2;BYDAY=TU;COUNT=10

# Monthly on the 15th for 1 year
FREQ=MONTHLY;BYMONTHDAY=15;COUNT=12

# Yearly on December 25th for 5 years
FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25;COUNT=5
```

## UI Components

### CreateEventModal

The CreateEventModal component has been updated to support recurring events:

1. **All Day Toggle**: Hide time inputs for all-day events
2. **Recurring Event Checkbox**: Enable/disable recurring events
3. **Frequency Selector**: Choose between Daily, Weekly, Monthly, Yearly, or Custom
4. **Custom Day Selector**: When "Custom" is selected, pick specific days of the week
5. **Recurrence End Options**:
   - **Never**: Infinite recurrence (no COUNT or UNTIL)
   - **On Date**: End on a specific date (uses UNTIL)
   - **After**: End after X occurrences (uses COUNT)

When "Recurring Event" is checked, the modal displays additional options for configuring the recurrence pattern.

## Sync Architecture

### How Recurring Events Sync

1. **Frontend Creates Base Event**: User creates a recurring event in the UI with recurrence rule
2. **Sync Push to Backend**: Event syncs to backend with recurrence_rule field
3. **Backend Generates Instances**: Backend detects recurrence rule and generates all instances
4. **Instances Sync Back**: Generated instances sync back to frontend on next pull
5. **All Instances Share recurrence_id**: Related events are grouped by recurrence_id for series operations

### Delete Options for Recurring Events

When deleting a recurring event, users have three options:

- **Delete Single Instance**: Delete only the selected occurrence
- **Delete All Occurrences**: Delete the entire recurring series
- **Delete Future Occurrences**: Delete this and all future instances

API endpoint: `POST /events/delete`
```typescript
{
  eventId: string;
  deleteType: 'single' | 'all' | 'future';
}
```

## Database Schema

Events with recurrence rules are stored with:

- `recurrence_rule`: VARCHAR(500) - iCalendar RRULE format string
- `recurrence_id`: UUID - Groups related recurring event instances
- `is_all_day`: BOOLEAN - Whether the event is an all-day event
- Individual event instances are created in the database
- All instances in a series share the same `recurrence_id` value

## Testing

### Backend Tests

Run backend tests:
```bash
cd backend
pnpm test recurring-events
```

Test coverage includes:
- Recurrence rule parsing (8 tests)
- Event instance generation (10 tests)
- Database operations (3 tests)

### Frontend Tests

Run frontend tests:
```bash
cd frontend
pnpm test recurring-events
```

Test coverage includes:
- Recurrence rule building (10 tests)

## Implementation Notes

1. **Instance Limit**: The service limits generation to 100 instances by default to prevent abuse
2. **Duration Preservation**: All generated instances maintain the same duration as the original event
3. **Future Operations**: Update and delete operations only affect future instances (after current time)
4. **Sync Support**: Events sync to frontend via WatermelonDB as individual records

## Future Enhancements

Potential improvements for future versions:

1. **Exception Dates**: Support for EXDATE to skip specific occurrences
2. **Modification Dates**: Support for RDATE to add specific occurrences
3. **Advanced Patterns**: Support for BYDAY with position (e.g., 2nd Tuesday)
4. **UI Enhancements**: Visual calendar picker for recurrence patterns
5. **Single Instance Edit**: Option to edit/delete single instance vs. series
6. **End Date Option**: UI support for UNTIL parameter

## Troubleshooting

### Events Not Appearing

If recurring events aren't showing up:

1. Check that the `recurrence_rule` field is properly set
2. Verify the date range for instance generation
3. Ensure COUNT or UNTIL parameters are set appropriately

### Performance Issues

If experiencing slow performance:

1. Reduce the COUNT or UNTIL range
2. Consider generating instances on-demand rather than batch creation
3. Use indexes on `start_time` and `recurrence_rule` columns

### Rule Parsing Errors

If recurrence rules aren't being parsed:

1. Verify the RRULE format matches iCalendar standard
2. Check that all parameter values are valid (e.g., BYDAY uses correct day codes)
3. Ensure FREQ is included (it's required)

## References

- [iCalendar RFC 5545](https://tools.ietf.org/html/rfc5545) - Official RRULE specification
- [RRULE.js Documentation](https://github.com/jakubroztocil/rrule) - Alternative JavaScript library for reference
