# Implementation Tasks: Modern Calendar View

**Branch**: `001-modern-calendar`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Phase 1: Setup & Dependencies

- [x] **Install Dependencies**
  - Action: Install `react-native-big-calendar` and its peer dependencies (`react-native-gesture-handler`, `react-native-reanimated`).
  - Action: Install `dayjs` (if not present) as it's often used with these calendar libraries.
  - Validation: Verify app builds and runs on iOS/Android/Web.

- [x] **Create Component Structure**
  - Action: Create `frontend/src/components/events/CalendarView.tsx` (Container).
  - Action: Create `frontend/src/components/events/CalendarHeader.tsx`.
  - Action: Create `frontend/src/components/events/EventItem.tsx`.
  - Validation: Components exist and can be imported.

## Phase 2: Core Calendar Implementation

- [x] **Implement Calendar Container**
  - Action: Implement `CalendarView` to manage state (`viewMode`, `currentDate`).
  - Action: Integrate `react-native-big-calendar` (or web equivalent).
  - Action: Connect `events` prop to the calendar component.
  - Validation: Calendar renders with dummy data.

- [x] **Implement Navigation & Header**
  - Action: Implement `CalendarHeader` with View Selector (Month/Week/Day/Agenda).
  - Action: Implement Next/Prev/Today navigation logic.
  - Validation: Can switch views and navigate dates.

- [x] Implement Month View
  - Configure Month view in the library.
  - Implement "Split View" logic for mobile (dots in grid, list below).
  - Validation: Month view displays correctly on mobile and web.

- [x] Implement Week/Day View
  - Configure Week and Day views.
  - Ensure "All-Day" section is visible.
  - Implement "Current Time" indicator.


## Phase 3: Interactions & Visuals

- [x] Integrate with Event List Screen
  - Replace the old list view in `frontend/app/events.tsx` with `CalendarView`.
  - Pass necessary props (events, users, handlers).

- [x] Implement Event Creation
  - Handle `onEmptySlotPress` to open `CreateEventModal` with pre-filled date.


- [x] Implement Agenda View
  - Create a custom Agenda view (list of events grouped by day).
  - Reuse EventItem component.


## Phase 4: Testing & Refinement

- [x] **Unit Tests**
  - Action: Write unit tests for `CalendarView` state logic.
  - Action: Write unit tests for `CalendarHeader` interactions.
  - Validation: All tests pass.

- [x] **E2E Tests**
  - Action: Update/Create E2E tests to verify calendar navigation and creation flow.
  - Validation: E2E tests pass (requires running backend).

- [x] Polish & Refinement
  - Ensure responsive layout (flex/height).
  - Check color contrast and accessibility.
  - Verify "Split View" behavior on different screen sizes.

## Phase 5: Modern Calendar Kit Integration (New)

- [x] **Install & Setup**
  - Action: Install `@howljs/calendar-kit`.
  - Validation: App builds successfully.

- [x] **Implement Day/Week View with Calendar Kit**
  - Action: Update `CalendarView` to use `CalendarKit` for Day and Week views.
  - Action: Configure drag and drop support.
  - Action: Configure `allowOverlap={false}` (or equivalent) to prevent overlapping events.
  - Validation: Day/Week views render with Calendar Kit and support drag/drop.

- [x] **Implement Resource View**
  - Action: Add "Resource" option to `CalendarHeader`.
  - Action: Implement Resource view using `CalendarKit` (resources = users).
  - Validation: Can switch to Resource view and see events grouped by user.

- [x] **Maintain Legacy Views**
  - Action: Ensure Month and Agenda views continue to use `react-native-big-calendar`.
  - Validation: All 4+ views (Day, Week, Month, Agenda, Resource) work correctly.

