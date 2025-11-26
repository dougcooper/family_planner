# Feature Specification: Family Dashboard

**Feature Branch**: `001-family-dashboard`
**Created**: 2025-11-20
**Status**: Draft
**Input**: User description: "Build a dashboard application that aggregates schedules, tasks, meal plans and lists from all family members in one highly visible, interactive location, aiming to reduce the 'mental load' of household management. Tasks can be associated with rewards that family members can work towards earning."

## Clarifications

### Session 2025-11-21 (Authentication Deep Dive)
- Q: How is the Family established? → A: **Initial Setup**: First user registers as Admin, creates the Family unit.
- Q: How are other Parents added? → A: **Invites**: Admin sends email invites; invitees register and set their own PIN.
- Q: How are Child accounts managed? → A: **Managed Accounts**: Parents create Child profiles and set their initial PINs.
- Q: How does Kiosk mode handle security vs. accessibility? → A: **View-Only Default**: The dashboard is always visible in a read-only "Family View".
- Q: When is a PIN required? → A: **Action Attribution**: Any write operation (completing tasks, editing lists) requires a User PIN to identify *who* is acting.

### Session 2025-11-20
- Q: How are points awarded upon task completion? → A: Approval Required: Task goes to 'Pending Review'; Parent must approve to award points.
- Q: What level of recurrence support is required for events and tasks? → A: Full Recurrence: Support Daily, Weekly, Monthly, Yearly, and Custom patterns.
- Q: How should authentication be handled for a shared family device? → A: Kiosk Mode w/ PINs: Device stays authenticated to the Family; users switch profiles via 4-digit PIN.
- Q: How should meal plan entries interact with the grocery list? → A: Quick Add: 'Add to List' button on a meal entry copies the meal name to the grocery list.
- Q: How should notifications be handled? → A: Email/Push: Critical alerts are sent via Email or Web Push to user devices.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Central Family Dashboard (Priority: P1)

As a family manager (parent), I want a single view that shows today's schedule, pending tasks, and dinner plans for everyone, so that I can understand the household status at a glance without checking multiple apps.

**Why this priority**: This is the core value proposition ("reduce mental load" via aggregation). Without the dashboard, it's just separate tools.

**Independent Test**: Can be tested by populating data for multiple members and verifying the dashboard displays the correct aggregated summary for the current day.

**Acceptance Scenarios**:

1. **Given** a family with events and tasks for today, **When** I open the dashboard, **Then** I see a "Today" section listing all events sorted by time and all incomplete tasks.
2. **Given** a meal plan exists for today, **When** I view the dashboard, **Then** the dinner menu is clearly visible.
3. **Given** multiple family members, **When** I view the dashboard, **Then** items are visually distinguished by owner (e.g., avatars or names).

---

### User Story 2 - Task Completion & Rewards (Priority: P1)

As a family member (e.g., child), I want to see my assigned tasks, mark them as complete, and earn points/rewards, so that I am motivated to help out.

**Why this priority**: Gamification is a key differentiator requested ("Tasks can be associated with rewards").

**Independent Test**: Create a task with point value, assign to user, user completes it, parent approves it, verify user balance increases.

**Acceptance Scenarios**:

1. **Given** a task worth 10 points assigned to me, **When** I mark it as "Done", **Then** the task status changes to "Pending Review" and my point balance remains unchanged.
2. **Given** a task in "Pending Review", **When** a parent approves it, **Then** the task becomes "Completed" and my point balance increases by 10.
3. **Given** I have enough points, **When** I view the rewards catalog, **Then** I can "purchase" a reward, deducting the points.
4. **Given** a task list, **When** I view it, **Then** I can clearly see the reward value associated with each task.

---

### User Story 3 - Shared Lists & Meal Planning (Priority: P2)

As a family member, I want to view and edit shared grocery lists and meal plans, so that everyone knows what's for dinner and what we need to buy.

**Why this priority**: Supports the "household management" aspect but secondary to the immediate "dashboard/status" and "rewards" loops.

**Independent Test**: User A adds item to list/meal plan, User B sees it immediately.

**Acceptance Scenarios**:

1. **Given** a shared grocery list, **When** I add "Milk", **Then** other family members see "Milk" on their view of the list.
2. **Given** the weekly meal planner, **When** I assign "Tacos" to Tuesday, **Then** it appears on the Tuesday slot for everyone.
3. **Given** a meal entry "Tacos", **When** I click "Add to List", **Then** "Tacos" is added to the grocery list.

## Functional Requirements

1.  **Family & User Management**
    *   **Initial Setup**: System requires an Admin user to register and create a "Family" unit.
    *   **Invites**: Admin can invite other users (Parents) via email to join the Family.
    *   **Managed Profiles**: Parents can create Child profiles (no email required) and assign 4-digit PINs.
    *   **Avatars**: Users can select or upload avatars for their profiles.
    *   **Roles**:
        *   *Admin/Parent*: Can manage users, settings, approve tasks, manage rewards.
        *   *Member/Child*: Can view dashboard, complete assigned tasks, redeem rewards.
    *   **Authentication (Kiosk Mode)**:
        *   **Device Binding**: Device logs in once with Family credentials. The system must issue a long-lived authentication token (persisted in local storage) so the PWA remains authenticated to the Family context indefinitely (or until explicitly revoked), surviving app restarts.
        *   **Default State**: Read-only "Family Dashboard" showing aggregated data.
        *   **User Session**: To perform actions, user selects their profile and enters PIN.
        *   **Auto-Logout**: User session reverts to Default State after a configurable period of inactivity (default: 2 minutes).

2.  **Dashboard Aggregation**
    *   Dashboard must display a "Today's Overview" widget.
    *   Dashboard must aggregate Calendar Events, Tasks, and Meal Plan for the current date.
    *   **Weather Widget**: Dashboard must display current weather information for a user-configured city.
    *   Dashboard must be responsive and optimized for tablet/kiosk resolution (e.g., 1024x768+).

3.  **Task & Reward System**
    *   Tasks must have properties: Title, Assignee(s), Due Date, Point Value, Status (Todo, Pending Review, Completed).
    *   Points are only awarded when a user with 'Parent' role approves a 'Pending Review' task.
    *   Rewards must have properties: Title, Cost (points), Icon (selected from a preset library, e.g., Lucide/Material).
    *   **Reward Claims**: System must track claimed rewards with a status lifecycle (Active, Unclaimed) to manage redemption.
    *   System must track point balances for each user.

4.  **Scheduling & Planning**
    *   Internal Calendar system to create/edit events with start/end times and assigned members (supporting multiple attendees).
    *   Events and Tasks must support complex recurrence patterns (Daily, Weekly, Monthly, Yearly, Custom).
    *   **Meal Planner**:
        *   Support for configurable meal labels (e.g., Breakfast, Lunch, Dinner, Snack) rather than fixed types.
        *   **Recipes**: Ability to store recipes with ingredients and instructions.
    *   **Quick Add**: Ability to copy a meal plan entry directly to the grocery list.
    *   **List Management**: Support for multiple list types (Grocery, Todo, Other) with add, remove, and check-off capabilities.

5.  **Notifications**
    *   **Channels**:
        *   **Web Push (VAPID)**: Immediate delivery for critical, time-sensitive alerts (e.g., "Dinner is ready", "Urgent Task").
        *   **Email**: Aggregated digests for non-urgent updates (e.g., "Daily Summary", "Weekly Task Report") to prevent inbox spam.
    *   **In-App Notification Center**:
        *   Users must have a "Notifications" view within their profile.
        *   History of all alerts and events relevant to the user.
        *   Ability to **Mark as Read** and **Delete** notifications.
    *   Must support "Add to Home Screen" (PWA) behavior to enable notifications on iOS.

## Success Criteria

*   **Performance**: Dashboard loads "Today's Overview" in under 2 seconds on standard Wi-Fi (per Constitution).
*   **Usability**: A user can mark a task as complete in fewer than 3 interactions (clicks/taps) from the main dashboard.
*   **Engagement**: System supports visual feedback (animation or toast) when a reward is earned or task completed.
*   **Visibility**: Dashboard text and elements must meet WCAG AA contrast ratios for readability on wall-mounted displays.

## Assumptions

*   **Data Source**: Application uses an offline-first architecture with local database (e.g., WatermelonDB) and background synchronization with the backend.
*   **Authentication**: Kiosk-first approach. Initial login establishes Family context; daily usage relies on PINs.
*   **Platform**: Web-based application accessible via browser.
*   **External Services**: SMTP server or Push Notification service required for alerts.

## Future Scope

*   **Mobile Application**: Native mobile apps (iOS/Android) are planned for a future iteration, not part of the MVP.
