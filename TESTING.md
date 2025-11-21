# Testing Guide

This document explains how to run tests in the Family Planner project.

## Test Organization

The project has three levels of tests:

1. **Backend Unit Tests** - Tests backend services, authentication, and database operations
2. **Frontend Unit Tests** - Tests frontend business logic (auth, tasks, rewards, points)
3. **E2E Integration Tests** - Tests the full sync flow between frontend and backend

## Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose (for E2E tests and backend)

## Running Tests

### Backend Tests

Backend tests use Vitest and test the API services directly against a PostgreSQL database.

```bash
# Start the database
docker-compose up -d postgres

# Run backend tests
cd backend
npm test -- --run

# Or from project root
npm test --workspace=backend
```

**Test Coverage:**
- 27 tests covering authentication, points service, and sync operations
- Tests run against real database (Docker container)
- All tests pass in < 1 second

### Frontend Unit Tests

Frontend unit tests use Jest and test business logic in isolation with mocked dependencies.

```bash
cd frontend
npm test

# Run only unit tests
npm run test:unit
```

**Test Coverage:**
- 28 tests covering auth logic, rewards, tasks, and point awarding
- All dependencies (AsyncStorage, WatermelonDB) are mocked
- Tests run in < 300ms

### E2E Integration Tests

E2E tests verify the complete sync flow between frontend and backend. These tests require the backend to be running.

```bash
# Make sure backend is running
docker-compose up -d

# Run E2E tests from project root
npm run test:e2e
```

**Test Coverage:**
- 7 tests covering sync pull/push, authentication, and data consistency
- Tests run against live backend API
- Automatically checks if backend is available before running

## Test Scripts

From the project root:

```bash
# Run all workspace tests (backend + frontend unit)
npm test

# Run E2E tests only
npm run test:e2e

# Run E2E tests with automatic backend startup (experimental)
npm run test:e2e:with-backend
```

## CI/CD Considerations

For continuous integration:

1. Start Docker Compose services
2. Wait for database health check
3. Run backend migrations
4. Run all test suites in parallel:
   - `npm test --workspace=backend`
   - `npm test --workspace=frontend`
   - `npm run test:e2e`

Example GitHub Actions workflow:

```yaml
- name: Start services
  run: docker-compose up -d
  
- name: Wait for services
  run: ./scripts/wait-for-services.sh

- name: Run tests
  run: |
    npm test --workspace=backend -- --run
    npm test --workspace=frontend
    npm run test:e2e
```

## Test Results Summary

| Test Suite | Location | Tests | Status |
|------------|----------|-------|--------|
| Backend Unit | `backend/tests/` | 27/27 | ✅ 100% |
| Frontend Unit | `frontend/tests/unit/` | 28/28 | ✅ 100% |
| E2E Integration | `tests/e2e/` | 7/7 | ✅ 100% |
| **Total** | | **62/62** | **✅ 100%** |

## Troubleshooting

### Backend tests fail with database connection error

Make sure PostgreSQL is running:
```bash
docker-compose up -d postgres
docker ps  # verify postgres container is running
```

### E2E tests timeout or fail

1. Check if backend is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Start backend if needed:
   ```bash
   docker-compose up -d
   ```

3. Check backend logs:
   ```bash
   docker logs family_dashboard_backend
   ```

### Frontend tests fail with module errors

Make sure dependencies are installed:
```bash
cd frontend
npm install
```

## Writing New Tests

### Backend Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { db } from '../src/db/index.js';

describe('My Feature', () => {
  it('should do something', async () => {
    // Your test here
  });
});
```

### Frontend Unit Tests (Jest)

```typescript
import { describe, it, expect } from '@jest/globals';

describe('My Component Logic', () => {
  it('should handle user action', () => {
    // Your test here
  });
});
```

### E2E Tests (Jest + Fetch)

```typescript
import { describe, it, expect } from '@jest/globals';

describe('My API Integration', () => {
  it('should sync data correctly', async () => {
    const response = await fetch(`${API_URL}/endpoint`);
    expect(response.ok).toBe(true);
  });
});
```

## Test Configuration Files

- `backend/package.json` - Vitest configuration inline
- `frontend/jest.config.js` - Jest configuration for React Native
- `jest.config.js` (root) - Jest configuration for E2E tests
- `tsconfig.json` (root) - TypeScript configuration for E2E tests
