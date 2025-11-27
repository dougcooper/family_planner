# Research: Modern Calendar View

**Feature**: Modern Calendar View
**Status**: Complete
**Date**: November 27, 2025

## 1. Library Selection

### Problem
The user requested `react-big-calendar`, which is a React (DOM) library incompatible with React Native. We need a React Native equivalent that supports Month, Week, Day, and Agenda views with infinite scrolling and custom rendering.

### Options Evaluated

| Library | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- |
| **`react-native-big-calendar`** | Modeled after `react-big-calendar` (familiar API). Supports Month, Week, Day. Active maintenance. | UI requires styling to look "modern". | **Recommended** |
| **`react-native-calendars` (Wix)** | Industry standard. Excellent Month/Agenda views. | Week/Day (Timeline) is heavy and complex. | Strong Alternative |
| **`react-native-calendar-kit`** | High performance (Reanimated). Best Day/Week UX (Zoom/Drag). | Lacks full Month view. | Best for Day/Week only |

### Decision
**Selected Library**: `react-native-big-calendar` (Mobile) / `react-big-calendar` (Web - Potential)
**Rationale**: `react-native-big-calendar` is the best choice for Mobile. For Web, we will first attempt to use `react-native-big-calendar` via `react-native-web` for code sharing. If that fails or provides a poor UX, we will use the user's originally requested `react-big-calendar` for the Web build using platform-specific extensions (`.web.tsx`).

### Implementation Details
- **Package**: `react-native-big-calendar`
- **Web Fallback**: `react-big-calendar` (if needed)
- **Dependencies**: `react-native-gesture-handler`, `react-native-reanimated` (likely already in project).
- **Customization**: Will need to override `renderEvent` and `renderHeader` to match the design.

## 2. Testing Strategy

### Unit Testing
- **Tool**: Jest + `@testing-library/react-native`
- **Scope**: Test individual view components (`MonthView`, `DayView`) and the container logic (switching views, navigation).
- **Mocking**: Mock the calendar library to test interactions without rendering the full complex grid in unit tests.

### E2E Testing
- **Tool**: Detox (as per `tests/e2e` existence)
- **Scope**: Verify critical user flows:
    1. Switch between views.
    2. Navigate to next/prev month.
    3. Create event via long-press.

## 3. Unknowns Resolved
- **Library Compatibility**: `react-big-calendar` is incompatible. `react-native-big-calendar` is the chosen replacement.
- **Navigation**: Infinite scroll is supported by the library.
- **Visuals**: Custom renderers will handle user color coding.
