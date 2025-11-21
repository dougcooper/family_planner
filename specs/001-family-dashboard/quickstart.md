# Quickstart: Family Dashboard

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local dev outside Docker)
- Moon (Monorepo tool): `npm install -g @moonrepo/cli`

## Running the Stack (Docker)

1.  **Build and Start**:
    ```bash
    moon docker scaffold backend
    docker-compose up --build
    ```
    This starts:
    - **Postgres**: Port 5432
    - **Backend**: Port 3000 (API)
    - **Frontend**: Port 8080 (Web Dashboard)

2.  **Access**:
    - Web Dashboard: `http://localhost:8080`
    - API Health: `http://localhost:3000/health`

## Local Development

### Backend
1.  `moon run backend:install`
2.  `moon run backend:migrate`
3.  `moon run backend:dev`

### Frontend
1.  `moon run frontend:install`
2.  `moon run frontend:web` (for Web) or `moon run frontend:ios` (for Mobile)

### Testing
- **Unit**: `moon run :test`
- **Sync Integration**: `moon run frontend:test-sync` (Runs headless E2E sync scenarios against backend)

## Database
- Default credentials: `user:password` / `family_db`
- Adminer/PgAdmin available at `http://localhost:8081` (if configured in compose)

## Initial Setup
1.  Open the Web Dashboard (`http://localhost:8080`).
2.  You will be redirected to the **Registration** screen.
3.  Create a new Family and Admin User.
4.  Once logged in, you can invite other members or create Child profiles in Settings.
