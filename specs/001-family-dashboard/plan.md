# Implementation Plan: Family Dashboard

**Branch**: `001-family-dashboard` | **Date**: 2025-11-20 | **Spec**: [specs/001-family-dashboard/spec.md](../spec.md)
**Input**: Feature specification from `/specs/001-family-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a Family Dashboard application aggregating schedules, tasks, and meal plans. The system features a "Kiosk Mode" for shared devices, a gamified reward system, and offline capabilities.
**Technical Approach**: React Native (TypeScript) frontend for cross-platform (Web/Mobile/Desktop) reuse, communicating via REST with a backend (Node.js). Data synchronization is handled by WatermelonDB. Deployment is containerized (Docker) for self-hosting.

## Technical Context

**Language/Version**: Frontend: TypeScript (React Native). Backend: Node.js (TypeScript).
**Primary Dependencies**: React Native, WatermelonDB, Docker, Drizzle ORM, moon (monorepo tool), web-push (VAPID).
**Storage**: Backend: PostgreSQL. Frontend: SQLite (via WatermelonDB).
**Testing**: Frontend: Jest (Unit), Detox/Maestro (E2E). Backend: Jest/Vitest. Sync: Integration tests verifying Frontend Logic <-> Backend Sync Protocol.
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
.moon/                   # Moonrepo configuration
backend/
├── Dockerfile
├── src/
│   ├── api/             # REST endpoints
│   ├── db/              # ORM & Migrations
│   └── sync/            # WatermelonDB sync endpoints
└── tests/

frontend/
├── Dockerfile
├── src/
│   ├── components/      # UI Views
│   ├── logic/           # Decoupled business logic
│   ├── model/           # WatermelonDB Schema & Models
│   └── api/             # API Client
└── tests/
    ├── unit/
    └── sync-integration/ # Headless E2E sync tests

docker-compose.yml       # Orchestration for self-hosting
```

**Structure Decision**: Monorepo with distinct `frontend` and `backend` directories to support separate Docker builds while allowing shared type definitions if possible.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - Plan aligns with Constitution.

## Phase 0: Outline & Research

1.  **Extract unknowns from Technical Context**:
    *   **Backend Language**: Rust vs Node.js? Needs to balance performance with "ORM code generation" and "WatermelonDB compliance".
    *   **GraphQL + WatermelonDB**: WatermelonDB sync is typically JSON/REST. Need to validate GraphQL adapter or pattern.
    *   **ORM Choice**: Must support code generation for client/server and ideally sync well with WatermelonDB.
    *   **React Native Web Docker**: Best practice for serving the web build.

2.  **Generate and dispatch research agents**:

    ```text
    Task: "Compare Rust vs Node.js for WatermelonDB compliant backend with GraphQL and ORM codegen"
    Task: "Research WatermelonDB synchronization over GraphQL"
    Task: "Find best ORM for code generation (Client & Server) compatible with chosen backend"
    Task: "Research React Native Web Docker hosting patterns"
    ```

3.  **Consolidate findings** in `research.md`.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
