# Implementation Tasks: Modern Calendar View

**Branch**: `001-modern-calendar`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Phase 1: Setup & Dependencies

- [ ] **Install Dependencies**
  - Action: Install `react-native-big-calendar` and its peer dependencies (`react-native-gesture-handler`, `react-native-reanimated`).
  - Action: Install `dayjs` (if not present) as it's often used with these calendar libraries.
  - Validation: Verify app builds and runs on iOS/Android/Web.

- [ ] **Create Component Structure**
  - Action: Create `frontend/src/components/events/CalendarView.tsx` (Container).
  - Action: Create `frontend/src/components/events/CalendarHeader.tsx`.
  - Action: Create `frontend/src/components/events/EventItem.tsx`.
  - Validation: Components exist and can be imported.

## Phase 2: Core Calendar Implementation

- [ ] **Implement Calendar Container**
  - Action: Implement `CalendarView` to manage state (`viewMode`, `currentDate`).
  - Action: Integrate `react-native-big-calendar` (or web equivalent).
  - Action: Connect `events` prop to the calendar component.
  - Validation: Calendar renders with dummy data.

- [ ] **Implement Navigation & Header**
  - Action: Implement `CalendarHeader` with View Selector (Month/Week/Day/Agenda).
  - Action: Implement Next/Prev/Today navigation logic.
  - Validation: Can switch views and navigate dates.

- [ ] **Implement Month View**
  - Action: Configure Month view in the library.
  - Action: Implement "Split View" logic for mobile (dots in grid, list below).
  - Validation: Month view displays correctly on mobile and web.

- [ ] **Implement Week/Day View**
  - Action: Configure Week and Day views.
  - Action: Ensure "All-Day" section is visible at the top.
  - Action: Implement "Current Time" indicator (red line).
  - Validation: Events appear in correct time slots.

## Phase 3: Interactions & Visuals

- [ ] **Implement Event Rendering**
  - Action: Implement `EventItem` custom renderer.
  - Action: Apply color coding based on `user_id`.
  - Validation: Events show correct colors and titles.

- [ ] **Implement Event Creation**
  - Action: Add `onLongPress` handler to grid slots.
  - Action: Open existing `CreateEventModal` with pre-filled date/time.
  - Validation: Long press triggers modal with correct defaults.

- [ ] **Implement Agenda View**
  - Action: Implement Agenda view (list of events).
  - Validation: Agenda view shows list of events.

## Phase 4: Testing & Refinement

- [ ] **Unit Tests**
  - Action: Write unit tests for `CalendarView` state logic.
  - Action: Write unit tests for `CalendarHeader` interactions.
  - Validation: All tests pass.

- [ ] **E2E Tests**
  - Action: Update/Create E2E tests to verify calendar navigation and creation flow.
  - Validation: E2E tests pass.

- [ ] **Final Polish**
  - Action: Verify responsive design on Web vs Mobile.
  - Action: Check accessibility labels.
  - Validation: Feature meets all success criteria.
