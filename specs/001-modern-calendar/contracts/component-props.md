# Component Contracts

## `CalendarView` (Container)

**Path**: `frontend/src/components/events/CalendarView.tsx`

### Props
| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `events` | `Event[]` | Yes | List of events to display |
| `users` | `User[]` | Yes | List of users for color mapping |
| `onEventPress` | `(event: Event) => void` | Yes | Callback when an event is tapped |
| `onEmptySlotPress` | `(date: Date) => void` | Yes | Callback when an empty slot is long-pressed |

## `CalendarHeader`

**Path**: `frontend/src/components/events/CalendarHeader.tsx`

### Props
| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `currentDate` | `Date` | Yes | Currently displayed date |
| `viewMode` | `'month' \| 'week' \| 'day' \| 'agenda'` | Yes | Current view mode |
| `onViewChange` | `(mode: Mode) => void` | Yes | Callback to change view |
| `onPrev` | `() => void` | Yes | Navigate backward |
| `onNext` | `() => void` | Yes | Navigate forward |
| `onToday` | `() => void` | Yes | Jump to today |

## `EventItem` (Custom Renderer)

**Path**: `frontend/src/components/events/EventItem.tsx`

### Props
| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `event` | `Event` | Yes | The event object |
| `color` | `string` | Yes | The assigned color for the event |
| `isAllDay` | `boolean` | No | Whether to render as all-day block |
