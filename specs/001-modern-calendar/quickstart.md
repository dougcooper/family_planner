# Quickstart: Modern Calendar View

## Overview
The Modern Calendar View replaces the simple event list with a full-featured calendar interface. It supports Month, Week, Day, and Agenda views with intuitive navigation and interaction.

## Usage

### Switching Views
- Use the **View Selector** (tabs/dropdown) at the top to switch between:
  - **Month**: High-level overview. Dots indicate events.
  - **Week**: Time-grid view for the week.
  - **Day**: Detailed time-grid for a single day.
  - **Agenda**: List of upcoming events.

### Navigation
- **Swipe**: Swipe left/right to move to the next/previous month/week/day.
- **Buttons**: Use the `<` and `>` arrows in the header.
- **Today**: Tap the "Today" button to jump to the current date.

### Creating Events
- **Long Press**:
  - In **Month View**: Long press a day cell to create an all-day event for that date.
  - In **Week/Day View**: Long press a time slot to create an event at that specific time.

### Visuals
- Events are color-coded by the family member assigned to them.
- All-day events appear at the top of the Day/Week view.
- A red line indicates the current time on the Day/Week grid.

## Development

### Components
- `CalendarView`: Main container managing state and view switching.
- `MonthView`, `WeekView`, `DayView`: Wrappers around `react-native-big-calendar`.

### Props
See `contracts/component-props.md` for API details.
