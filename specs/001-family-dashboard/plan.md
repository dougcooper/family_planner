# Implementation Plan: Family Dashboard

**Branch**: `001-family-dashboard` | **Date**: 2025-11-20 | **Spec**: [specs/001-family-dashboard/spec.md](../spec.md)
**Input**: Feature specification from `/specs/001-family-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a Family Dashboard application aggregating schedules, tasks, and meal plans. The system features a "Kiosk Mode" for shared devices, a gamified reward system, and offline capabilities.
**Technical Approach**: React Native (Expo) frontend for cross-platform (Web/Mobile/Desktop) reuse, communicating via REST (Fastify) with a backend (Node.js). Data synchronization is handled by WatermelonDB. Deployment is containerized (Docker) for self-hosting.

## Technical Context

**Language/Version**: Frontend: TypeScript (React Native/Expo). Backend: Node.js (TypeScript).
**Primary Dependencies**: React Native (Expo), WatermelonDB, Docker, Drizzle ORM, Turbo (monorepo tool), Fastify, web-push (VAPID).
**Storage**: Backend: PostgreSQL. Frontend: SQLite (via WatermelonDB/LokiJS).
**Testing**: Frontend: Jest (Unit). Backend: Vitest. E2E: Jest (Headless Sync Integration).
**Target Platform**: Web (Dockerized), Desktop, Mobile (Future).
**Project Type**: Monorepo (Frontend + Backend).
**Performance Goals**: Dashboard load < 2s.
**Constraints**: Offline-first (WatermelonDB), Self-hostable (Docker Compose), Code Generation for types, VAPID Notifications.
**Scale/Scope**: Single family instance, low concurrency, high availability required.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*   **I. Code Quality**: Frontend logic must be decoupled from views to enable headless testing.
*   **II. Testing**: Mandatory Unit and Integration tests for both Frontend and Backend.
*   **III. UX**: Consistent UI across Web/Desktop/Mobile using React Native.
*   **IV. Performance**: < 2s load time mandated. Offline support ensures responsiveness.

## Project Structure

### Documentation (this feature)

```text
specs/001-family-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
.turbo/                   # Turborepo configuration
backend/
├── Dockerfile
├── src/
│   ├── api/             # REST endpoints (Fastify)
│   ├── db/              # Drizzle ORM & Migrations
│   └── sync/            # WatermelonDB sync endpoints
└── tests/               # Vitest tests

frontend/
├── Dockerfile
├── app/                 # Expo Router pages
├── src/
│   ├── components/      # UI Views
│   ├── logic/           # Decoupled business logic
│   ├── model/           # WatermelonDB Schema & Models
│   └── api/             # API Client
└── tests/
    ├── unit/            # Jest tests
    └── mocks/

tests/
└── e2e/                 # Jest E2E Sync tests

docker-compose.yml       # Orchestration for self-hosting
```

**Structure Decision**: Monorepo with distinct `frontend` and `backend` directories managed by Turbo.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - Plan aligns with Constitution.

## Phase 0: Outline & Research

1.  **Extract unknowns from Technical Context**:
    *   **Backend Language**: Node.js with Fastify chosen for performance and ecosystem.
    *   **Sync Protocol**: WatermelonDB JSON sync over REST chosen (simpler than GraphQL adapter).
    *   **ORM Choice**: Drizzle ORM chosen for TypeScript safety and migration management.
    *   **Hosting**: Dockerized Node.js backend + Static frontend serving.

2.  **Generate and dispatch research agents**:

    *   *Completed*: Node.js (Fastify) selected.
    *   *Completed*: REST Sync selected.
    *   *Completed*: Drizzle ORM selected.
    *   *Completed*: Docker containerization implemented.

3.  **Consolidate findings** in `research.md`.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
