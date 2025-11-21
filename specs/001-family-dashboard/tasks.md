# Implementation Tasks: Family Dashboard

**Feature**: Family Dashboard
**Spec**: [specs/001-family-dashboard/spec.md](./spec.md)
**Status**: Pending

## Phase 1: Setup (Project Initialization)

**Goal**: Initialize the monorepo, backend, frontend, and infrastructure.

- [X] T001 Initialize Moonrepo structure and workspace configuration in `.moon/workspace.yml`
- [X] T002 [P] Setup Backend Fastify application structure in `backend/src/app.ts`
- [X] T003 [P] Configure Drizzle ORM and Postgres connection in `backend/src/db/index.ts`
- [X] T004 [P] Setup Frontend React Native (Expo) application in `frontend/app.json`
- [X] T005 [P] Configure WatermelonDB DatabaseProvider in `frontend/src/model/database.ts`
- [X] T006 [P] Create Docker Compose configuration for Postgres and App in `docker-compose.yml`
- [X] T007 [P] Configure Shared Types package structure in `packages/types/package.json`

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Establish Authentication, Sync Protocol, and User Management.
**Blocking**: Must be completed before User Stories.

- [X] T008 Define Family, User, Invitation, Notification schemas in `backend/src/db/schema.ts`
- [X] T009 Define Family, User, Notification models in `frontend/src/model/schema.ts`
- [X] T010 Implement Registration endpoint (Family + Admin) in `backend/src/api/auth/register.ts`
- [X] T011 Implement Login endpoint (Email/Pass -> Token) in `backend/src/api/auth/login.ts`
- [X] T012 Implement Sync Pull endpoint logic in `backend/src/sync/pull.ts`
- [X] T013 Implement Sync Push endpoint logic in `backend/src/sync/push.ts`
- [X] T014 Configure Web Push (VAPID) service in `backend/src/services/notifications.ts`
- [X] T015 Implement Frontend Auth Provider (Persistence) in `frontend/src/logic/auth.ts`
- [X] T016 Implement Frontend Sync Logic (WatermelonDB Adapter) in `frontend/src/logic/sync.ts`
- [X] T043 [P] Implement PIN Pad / Profile Switcher UI Component in `frontend/src/components/auth/PinPad.tsx`

## Phase 3: User Story 1 - Central Family Dashboard (P1)

**Goal**: Aggregate schedule, tasks, and meals in a single view.
**Story**: [US1] As a family manager, I want a single view of today's status.

- [ ] T017 [US1] Define Event, Task, MealPlan schemas in `backend/src/db/schema.ts`
- [ ] T018 [US1] Define Event, Task, MealPlan models in `frontend/src/model/schema.ts`
- [ ] T019 [US1] Implement Event/Task/MealPlan Sync handlers in `backend/src/sync/handlers.ts`
- [ ] T020 [US1] Create Dashboard Layout component in `frontend/src/components/dashboard/DashboardLayout.tsx`
- [ ] T021 [US1] Implement Today's Overview Widget in `frontend/src/components/dashboard/TodayWidget.tsx`
- [ ] T022 [US1] Implement Event List Component in `frontend/src/components/dashboard/EventList.tsx`
- [ ] T023 [US1] Implement Task List Summary Component in `frontend/src/components/dashboard/TaskListSummary.tsx`
- [ ] T024 [US1] Implement Dinner Summary Component in `frontend/src/components/dashboard/DinnerSummary.tsx`

## Phase 4: User Story 2 - Task Completion & Rewards (P1)

**Goal**: Gamified task system with points and rewards.
**Story**: [US2] As a family member, I want to earn points for tasks.

- [ ] T025 [US2] Define Reward schema in `backend/src/db/schema.ts`
- [ ] T026 [US2] Define Reward model in `frontend/src/model/schema.ts`
- [ ] T027 [US2] Update Task schema for status/points in `backend/src/db/schema.ts`
- [ ] T028 [US2] Implement Task Completion Logic (Status Transition) in `frontend/src/logic/task.ts`
- [ ] T029 [US2] Implement Point Awarding Logic (Parent Approval) in `backend/src/services/points.ts`
- [ ] T030 [US2] Create Task Detail/Edit View in `frontend/src/components/tasks/TaskDetail.tsx`
- [ ] T031 [US2] Create Reward Catalog View in `frontend/src/components/rewards/RewardCatalog.tsx`
- [ ] T032 [US2] Implement Reward Redemption Logic in `frontend/src/logic/rewards.ts`

## Phase 5: User Story 3 - Shared Lists & Meal Planning (P2)

**Goal**: Collaborative grocery lists and meal planning.
**Story**: [US3] As a family member, I want to manage lists and meals.

- [ ] T033 [US3] Define GroceryItem schema in `backend/src/db/schema.ts`
- [ ] T034 [US3] Define GroceryItem model in `frontend/src/model/schema.ts`
- [ ] T035 [US3] Implement Grocery List View (Add/Check/Delete) in `frontend/src/components/lists/GroceryList.tsx`
- [ ] T036 [US3] Implement Meal Planner Calendar View in `frontend/src/components/meals/MealPlanner.tsx`
- [ ] T037 [US3] Implement "Quick Add to List" logic in `frontend/src/logic/meals.ts`

## Phase 6: Polish & Cross-Cutting

**Goal**: Refine UX, Notifications, and PWA features.

- [ ] T038 Implement Configurable Auto-Logout (Kiosk Mode) in `frontend/src/logic/auth.ts`
- [ ] T039 Implement Notification Center UI in `frontend/src/components/notifications/NotificationCenter.tsx`
- [ ] T040 Implement Email Digest Service (Daily/Weekly) in `backend/src/services/email.ts`
- [ ] T041 Configure PWA Manifest (Icons, Display Mode) in `frontend/public/manifest.json`
- [ ] T042 Implement Headless E2E Sync Tests in `frontend/tests/sync-integration/sync.test.ts`
- [ ] T044 Audit and Fix Accessibility (WCAG AA) across all views
- [ ] T045 Implement Unit Tests for Business Logic (Auth, Rewards, Tasks)

## Dependencies

1.  **Phase 1 & 2** are prerequisites for all User Stories.
2.  **US1 (Dashboard)** establishes the core UI shell.
3.  **US2 (Tasks)** extends the Task model introduced in US1.
4.  **US3 (Lists)** is largely independent but shares the Sync infrastructure.

## Implementation Strategy

*   **MVP Scope**: Phases 1, 2, and 3 (Dashboard) provide the minimum viable value.
*   **Parallel Execution**: Frontend components and Backend schema/sync handlers can often be developed in parallel once the shared types are defined.
*   **Testing**: Run `moon run frontend:test-sync` after implementing Sync Logic (T016) and before starting US1 UI work to ensure data flow is solid.
