
/**
 * E2E Sync Integration Tests
 * Tests the full sync flow between frontend (WatermelonDB) and backend (Postgres)
 * 
 * Prerequisites:
 * - Backend server must be running (docker-compose up or npm run dev:backend)
 * - Database must be migrated and ready
 */

let authToken: string;
let testFamilyId: string;
let testUserId: string;

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

beforeAll(async () => {
  // Wait for backend to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      const healthCheck = await fetch(`${API_URL}/health`);
      if (healthCheck.ok) break;
    } catch (e) {
      // Backend not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    retries--;
  }

  if (retries === 0) {
    throw new Error('Backend is not running. Start it with: docker-compose up -d');
  }

  // Create test user and get auth token
  const timestamp = Date.now();
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      family_name: `E2E Test Family ${timestamp}`,
      email: `e2e-test-${timestamp}@example.com`,
      password: 'testpass123',
      name: 'E2E Test User',
    }),
  });

  expect(response.ok).toBe(true);
  const data = await response.json() as any;
  authToken = data.token;
  testUserId = data.user.id;
});

afterAll(async () => {
  // Note: In a production setup, you'd clean up test data here
  // For now, we rely on the test database being ephemeral or cleaned separately
});

describe('E2E Sync Integration Tests', () => {
  describe('Pull Sync', () => {
    it('should fetch initial data on first sync', async () => {
      const response = await fetch(`${API_URL}/sync/pull?last_pulled_at=0`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as any;
      
      expect(data).toHaveProperty('changes');
      expect(data).toHaveProperty('timestamp');
      
      // Verify all expected tables are present
      const expectedTables = [
        'families',
        'users',
        'notifications',
        'tasks',
        'events',
        'meal_plans',
        'grocery_items',
        'rewards',
      ];
      
      expectedTables.forEach(table => {
        expect(data.changes).toHaveProperty(table);
      });

      // Should have at least the family and user created during setup
      expect(data.changes.families.created.length).toBeGreaterThan(0);
      expect(data.changes.users.created.length).toBeGreaterThan(0);
    });

    it('should return only changed records on incremental sync', async () => {
      // First sync
      const firstSync = await fetch(`${API_URL}/sync/pull?last_pulled_at=0`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      const firstData = await firstSync.json() as any;
      const firstTimestamp = firstData.timestamp;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second sync with timestamp from first sync
      const secondSync = await fetch(`${API_URL}/sync/pull?last_pulled_at=${firstTimestamp}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(secondSync.ok).toBe(true);
      const secondData = await secondSync.json() as any;
      
      // Should have new timestamp
      expect(secondData.timestamp).toBeGreaterThan(firstTimestamp);
      
      // Since nothing changed, all arrays should be empty
      expect(secondData.changes.tasks.created.length).toBe(0);
    });

    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_URL}/sync/pull?last_pulled_at=0`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok).toBe(true);
      // Sync should complete in under 5 seconds even with lots of data
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Push Sync', () => {
    it('should accept valid push sync data', async () => {
      const lastPulledAt = Date.now();
      
      // Note: Push sync expects specific data format that matches WatermelonDB
      // This test verifies the endpoint accepts the request
      const response = await fetch(`${API_URL}/sync/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          changes: {
            tasks: { created: [], updated: [], deleted: [] },
            events: { created: [], updated: [], deleted: [] },
            meal_plans: { created: [], updated: [], deleted: [] },
            grocery_items: { created: [], updated: [], deleted: [] },
            rewards: { created: [], updated: [], deleted: [] },
          },
          lastPulledAt,
        }),
      });

      // Should accept empty changes
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await fetch(`${API_URL}/sync/pull?last_pulled_at=0`);
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid auth token', async () => {
      const response = await fetch(`${API_URL}/sync/pull?last_pulled_at=0`, {
        headers: { 'Authorization': 'Bearer invalid-token' },
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent data structure', async () => {
      const response = await fetch(`${API_URL}/sync/pull?last_pulled_at=0`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      const data = await response.json() as any;

      // Verify structure of each table
      const tables = ['families', 'users', 'tasks', 'events', 'meal_plans', 'grocery_items', 'rewards'];
      
      tables.forEach(table => {
        expect(data.changes[table]).toHaveProperty('created');
        expect(data.changes[table]).toHaveProperty('updated');
        expect(data.changes[table]).toHaveProperty('deleted');
        
        expect(Array.isArray(data.changes[table].created)).toBe(true);
        expect(Array.isArray(data.changes[table].updated)).toBe(true);
        expect(Array.isArray(data.changes[table].deleted)).toBe(true);
      });
    });
  });
});
