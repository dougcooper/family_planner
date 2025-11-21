# Research: Backend Stack for Family Dashboard

## Executive Summary

For a "Family Dashboard" application with **WatermelonDB** sync requirements, **Node.js (TypeScript)** is the recommended backend choice over Rust. While Rust offers superior performance and type safety, the complexity of implementing the WatermelonDB sync protocol manually in Rust outweighs the benefits for this specific use case. Node.js allows for direct code sharing of the sync logic and types with the React Native frontend.

## 1. Backend Language Decision

### Node.js (TypeScript)
*   **Pros**:
    *   **Shared Language**: Frontend and backend are both TypeScript. You can share the exact `SyncPullResult` and `SyncPushArgs` interfaces.
    *   **WatermelonDB Ecosystem**: Most examples and community support for WatermelonDB backends are in JavaScript/Node.js.
    *   **Speed of Development**: Faster iteration, especially when defining the complex JSON structures required for sync.
*   **Cons**:
    *   Runtime performance is lower than Rust (though likely negligible for a family dashboard).
    *   Type safety relies on tooling (tsc) rather than the compiler's strict guarantees.

### Rust
*   **Pros**:
    *   **Performance**: Extremely low resource usage, ideal for self-hosting on low-power devices (e.g., Raspberry Pi).
    *   **Reliability**: "If it compiles, it works" philosophy reduces runtime errors.
    *   **Types**: `ts-rs` can generate TypeScript interfaces from Rust structs, bridging the gap.
*   **Cons**:
    *   **Protocol Implementation**: You must manually implement the WatermelonDB sync protocol (parsing complex JSON blobs, handling timestamps, batching updates). This is verbose in Rust.
    *   **Serialization**: Handling the dynamic nature of the `changes` object (where keys are table names) requires more boilerplate with `serde`.

**Verdict**: **Node.js** is the pragmatic choice. The "offline-first" complexity is already high; adding Rust's strictness to the backend sync logic adds unnecessary friction.

## 2. ORM Choice & Codegen

### Node.js: Prisma vs. Drizzle

| Feature | Prisma | Drizzle |
| :--- | :--- | :--- |
| **Type Safety** | Excellent (Generated Client) | Excellent (Inferred from Schema) |
| **Migrations** | Automated (Prisma Migrate) | Manual / CLI generated |
| **WatermelonDB Fit** | **Good**. Middleware can handle "Soft Delete" (required for sync). | **Better**. More control over SQL queries, easier to write optimized "changes since" queries. |
| **Codegen** | Generates its own client. | Generates TypeScript types directly. |

*   **Recommendation**: **Drizzle**. It is lighter, gives you more control over the raw SQL (crucial for efficient sync queries like `WHERE updated_at > ?`), and fits the "TypeScript-first" mental model better than Prisma's DSL.

### Rust: SeaORM vs. Diesel

| Feature | SeaORM | Diesel |
| :--- | :--- | :--- |
| **Style** | Async, Dynamic (like an ORM) | Sync/Async, Compile-time checked SQL |
| **Codegen** | Generates Rust entities from DB. | Generates Rust schema from DB. |
| **Soft Delete** | Has built-in "Soft Delete" patterns. | Manual implementation. |

*   **Recommendation**: **SeaORM**. It is async-first (great for web servers like Axum) and has better ergonomics for dynamic queries, which helps when iterating over different tables for the sync protocol.

## 3. API Strategy: GraphQL vs. REST

**Requirement**: WatermelonDB Sync.

*   **The Conflict**: WatermelonDB's sync protocol is designed around two specific endpoints: `pullChanges` (GET) and `pushChanges` (POST). It expects a specific JSON format.
*   **GraphQL Approach**: You *can* wrap these in a GraphQL Query and Mutation.
    *   *Pros*: Single API endpoint.
    *   *Cons*: You have to manually type the massive JSON blob as a `JSON` scalar or a complex input type in GraphQL. It defeats the purpose of GraphQL's strong typing because the sync payload is dynamic.
*   **REST Approach**: Keep `sync` as a separate REST endpoint.
    *   *Pros*: Simple, standard, streams large JSON responses easily.
    *   *Cons*: Two API styles (REST for sync, GraphQL for complex server-side queries).

**Verdict**: **REST Only**. Use **REST endpoints for everything**. For a Family Dashboard where *all* data is likely synced to the client, adding GraphQL adds unnecessary complexity.

## 4. Docker Strategy

*   **Self-Hosting**: Both Node.js and Rust containerize well.
*   **Rust**: Produces a tiny image (scratch/alpine + binary), < 50MB.
*   **Node.js**: Larger image (node:alpine), ~200MB+.
*   **React Native Web**:
    *   Build the web bundle (`npx expo export:web`).
    *   Serve it using `nginx` in a Docker container.
    *   Use a reverse proxy (Traefik/Nginx) to route `/api` to the backend and `/` to the frontend.

## 5. Push Notifications

**Requirement**: "No cost" and "Self-hosted" solution for critical alerts.

### Option A: Web Push API (VAPID)
*   **Mechanism**: Standard browser API. The backend signs a payload with a private key; the browser vendor's push service delivers it.
*   **Pros**:
    *   **Zero Cost**: Uses free browser push services (Mozilla, Google, Apple).
    *   **No Infrastructure**: No extra Docker container needed. Just a Node.js library (`web-push`).
    *   **Native**: Works directly in the browser (Chrome, Firefox, Edge, Safari 16+).
*   **Cons**:
    *   **iOS Limitations**: On iOS, Web Push only works if the user adds the website to their Home Screen (PWA).
    *   **Delivery**: Not guaranteed for "critical" alerts if the browser is closed (though Service Workers handle background events).

### Option B: ntfy.sh (Self-Hosted)
*   **Mechanism**: A dedicated Go-based server that clients subscribe to via a mobile app.
*   **Pros**:
    *   **Reliability**: Dedicated mobile app ensures delivery even if the dashboard isn't open.
    *   **Simplicity**: Very simple HTTP PUT API.
*   **Cons**:
    *   **Extra App**: Users must install the `ntfy` app on their phones.
    *   **Infrastructure**: Requires running an extra Docker container (`binwiederhier/ntfy`).

**Verdict**: **Web Push (VAPID)**.
*   **Reasoning**: It aligns perfectly with the "Web-based application" constraint and requires zero additional infrastructure or third-party apps. The "Add to Home Screen" requirement on iOS is an acceptable trade-off for a "Family Dashboard" that is likely used as a PWA anyway.
*   **Implementation**: Use the `web-push` Node.js library. Store subscriptions in the Postgres database.

### Future Scope: Native Mobile Apps
When the project expands to native iOS/Android apps (React Native), VAPID will not be sufficient.
*   **iOS Native**: Requires **APNs** (Apple Push Notification service). *Constraint*: Requires paid Apple Developer Program ($99/yr).
*   **Android Native**: Requires **FCM** (Firebase Cloud Messaging). *Constraint*: Free, but requires Google account setup.
*   **Strategy**: The backend will eventually need a multi-provider library (like `node-pushnotifications`) to send to VAPID (Web), APNs (iOS Native), and FCM (Android Native) depending on the user's device type.

## 6. Framework Strategy: Micro vs. Batteries-Included

**Question**: Should we use a "batteries-included" framework like **AdonisJS** or **NestJS** instead of assembling Fastify + Drizzle?

### Option A: AdonisJS (Batteries-Included)
*   **Pros**:
    *   **Integrated Tooling**: Auth, Mail (for digests/invites), Validation, and Testing are built-in and pre-configured.
    *   **Structure**: Enforces a clean MVC architecture, reducing "decision fatigue".
    *   **Documentation**: Excellent, cohesive documentation for the entire stack.
*   **Cons**:
    *   **ORM (Lucid)**: Adonis defaults to Lucid (Active Record). While powerful, sharing Lucid models (which are Classes) with a React Native frontend is difficult because they rely on the backend runtime.
    *   **Type Sharing**: To share types, you often have to create separate DTOs or interfaces, duplicating work.
    *   **Monorepo Friction**: Importing Adonis code into a non-Adonis package (like the frontend) can be tricky due to its IoC container.

### Option B: Fastify + Drizzle (Composable)
*   **Pros**:
    *   **Shared Schema**: With Drizzle, you define the DB schema in a shared `packages/db` folder. Both the Backend and the Frontend (WatermelonDB adapter) can import the **exact same type definitions**.
    *   **Sync Efficiency**: Drizzle acts as a query builder, making it easier to write the specific, optimized SQL queries needed for the WatermelonDB sync protocol.
    *   **Flexibility**: You can choose the best-in-class tools for specific needs (e.g., `bullmq` for queues, `resend` for emails).
*   **Cons**:
    *   **Boilerplate**: You must manually wire up Auth, Email, and Validation.

**Verdict**: **Stick with Fastify + Drizzle**.
*   **Reasoning**: The "Killer Feature" of this project is the **Offline Sync**. This relies heavily on the Frontend and Backend agreeing *exactly* on the data structure. Drizzle's ability to share the schema types directly with the React Native app outweighs the convenience of AdonisJS's built-in features. We can easily add `fastify-mailer` and a simple Auth pattern to bridge the gap.

## Final Recommendation

To build the **Family Dashboard** with the least friction and highest success rate:

1.  **Backend**: **Node.js** with **Fastify**.
2.  **ORM**: **Drizzle ORM**. It's modern, fast, and great with TypeScript.
3.  **API**: **REST**.
4.  **Notifications**: **Web Push (VAPID)**.
5.  **Shared Types**: Use a monorepo (Turborepo/Nx). Define your database schema in a shared package. Drizzle can infer Zod schemas or TS types that both Frontend and Backend import.
