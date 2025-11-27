# Data Model: Modern Calendar View

**Feature**: Modern Calendar View
**Status**: Draft

## Entities

### Event
Existing entity in WatermelonDB.

| Field | Type | Description | Usage in Calendar |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Event title | Displayed in event block/dot |
| `startTime` | `Date` | Start timestamp | Positioning in grid |
| `endTime` | `Date` | End timestamp | Height/Duration in grid |
| `isAllDay` | `boolean` | All-day flag | Displayed in top "all-day" section |
| `userId` | `string` | Foreign Key (User) | Determines event color |
| `recurrenceRule` | `string?` | RRule string | Used for repeating logic (if client-side expansion needed) |

### User
Existing entity.

| Field | Type | Description | Usage in Calendar |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique ID | Mapping to colors |
| `name` | `string` | Display Name | Legend/Tooltip |
| `avatarUrl` | `string?` | Avatar | Optional visual indicator |

## Relationships

- **Event** belongs to **User** (optional).
- **Event** belongs to **Family**.

## State Management

- **View State**: `viewMode` (Month | Week | Day | Agenda) - Local state.
- **Date State**: `selectedDate` (Date) - Local state.
- **Event Data**: Observable query from WatermelonDB, filtered by date range of the current view.
