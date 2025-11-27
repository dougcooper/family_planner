# Feature Specification: Modern Calendar View

**Feature Branch**: `001-modern-calendar`
**Created**: November 27, 2025
**Status**: Draft
**Input**: User description: "currently the event view is just a list of events. i want to enhance this view to have a modern calendar view you might find in mos calendar applications. i want to be able to Select Day, Week, Month, Agenda views. i want to be able to navigate Back, Forward, and always go back to today. Ideally i want to be able to Show time marker on day view."

## Clarifications

### Session 2025-11-27
- Q: How should the Month view display events on small screens? → A: Split View (Dots + List) - Calendar grid shows dots/markers; selecting a day shows a list of that day's events below.
- Q: How should events be visually distinguished in the calendar? → A: By User - Assign a unique color to each family member; dots and event blocks inherit this color.
- Q: What should be the default view when opening the calendar? → A: Month View - Provides a high-level overview of the entire month.
- Q: What navigation style should be used? → A: Infinite Scroll - Users can swipe/scroll continuously to navigate time periods (in addition to next/prev buttons).
- Q: How should users create events from the calendar grid? → A: Long Press - Long-pressing a time slot or day cell opens the creation modal with that date/time pre-filled.
- Q: How should all-day events be displayed in Day/Week views? → A: Top of Grid - A dedicated row at the top of the view separates all-day events from the time grid.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Calendar by Month/Week/Day (Priority: P1)

As a user, I want to view my events in a standard calendar grid (Month, Week, Day) so I can visualize my schedule in different granularities.

**Why this priority**: This is the core functionality of the requested feature, transforming the list view into a calendar.

**Independent Test**: Can be fully tested by switching between views and verifying events appear in the correct visual slots.

**Acceptance Scenarios**:

1. **Given** I navigate to the events page, **Then** I see the **Month view by default**.
2. **Given** I am on the events page, **When** I select "Month" view, **Then** I see a grid representing the current month with **dots/markers colored by user** indicating days with events. Selecting a day displays the detailed list of events for that day below the grid.
3. **Given** I am on the events page, **When** I select "Week" view, **Then** I see a column-based view for the current week with time slots, showing events at their specific times.
4. **Given** I am on the events page, **When** I select "Day" view, **Then** I see a detailed view of the current day with time slots.
5. **Given** I am on the events page, **When** I select "Agenda" view, **Then** I see a list of events, likely grouped by date (similar to the original view but integrated).

---

### User Story 2 - Calendar Navigation (Priority: P1)

As a user, I want to navigate between time periods (next/prev month/week/day) and quickly jump back to today.

**Why this priority**: Essential for browsing the schedule beyond the current view.

**Independent Test**: Can be tested by navigating forward/backward and verifying the displayed date range changes correctly.

**Acceptance Scenarios**:

1. **Given** I am on Month view, **When** I swipe left or click "Next", **Then** the view updates to the next month.
2. **Given** I am on Week view, **When** I swipe right or click "Previous", **Then** the view updates to the previous week.
3. **Given** I am viewing a future or past date, **When** I click "Today", **Then** the view returns to the period containing the current date.

---

### User Story 3 - Current Time Indicator (Priority: P2)

As a user, I want to see a visual marker for the current time on the Day view (and Week view if applicable).

**Why this priority**: Helps the user quickly orient themselves within the current day's schedule.

**Independent Test**: Verify a visual line or marker exists at the correct vertical position corresponding to the current time.

**Acceptance Scenarios**:

1. **Given** I am on Day view for the current date, **When** I view the schedule, **Then** I see a horizontal line or marker indicating the current time.
2. **Given** time passes, **When** I refresh or wait, **Then** the marker updates its position to reflect the new time.

---

### User Story 4 - Quick Event Creation (Priority: P2)

As a user, I want to create a new event by interacting directly with the calendar grid so that the date and time are automatically selected.

**Why this priority**: Improves usability by reducing manual data entry.

**Independent Test**: Long press a slot and verify the create modal opens with the correct start time.

**Acceptance Scenarios**:

1. **Given** I am on Week or Day view, **When** I long-press a specific time slot (e.g., 2:00 PM), **Then** the "Create Event" modal opens with the start time pre-filled to 2:00 PM on that day.
2. **Given** I am on Month view, **When** I long-press a specific day cell, **Then** the "Create Event" modal opens with the date pre-filled.

### Edge Cases

- What happens when an event spans across multiple days? (Should be visually continuous or repeated).
- How does the system handle overlapping events in Day/Week view? (Should display them side-by-side or overlapping but readable).
- What happens when there are too many events to fit in a Month view cell? (Should show a "+X more" indicator).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide Month, Week, Day, and Agenda views for events, defaulting to Month view on initial load.
- **FR-002**: System MUST allow users to switch between these views via a control (e.g., tabs or dropdown).
- **FR-003**: System MUST allow navigation to previous and next time periods via both swipe gestures (infinite scroll) and manual controls (buttons).
- **FR-004**: System MUST provide a "Today" action to return the view to the current date.
- **FR-005**: System MUST display a visual indicator for the current time on Day and Week views when viewing the current day.
- **FR-006**: System MUST display events with correct start and end times in the visual grid.
- **FR-007**: System MUST handle multi-day events by displaying them across all relevant days.
- **FR-008**: System MUST handle concurrent (overlapping) events by visually distinguishing them.
- **FR-009**: System MUST visually distinguish events by assigning a unique color to each user/family member.
- **FR-010**: System MUST trigger the "Create Event" flow with pre-filled date/time upon long-pressing a calendar grid cell or time slot.
- **FR-011**: System MUST display all-day events in a dedicated section at the top of the Day and Week views, separate from the time grid.

### Key Entities *(include if feature involves data)*

- **Event**: The core data entity, containing `title`, `startTime`, `endTime`, `description`, etc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between any of the 4 views (Month, Week, Day, Agenda) in under 1 second.
- **SC-002**: Navigation between time periods updates the view correctly 100% of the time.
- **SC-003**: Events are visually displayed within their correct date/time slots with no alignment errors.
- **SC-004**: The current time indicator is visible and accurate to the current minute on the Day view.
