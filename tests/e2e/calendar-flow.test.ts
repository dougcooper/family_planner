const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Calendar E2E Flow', () => {
  let authToken: string;
  let userId: string;
  let familyId: string;

  beforeAll(async () => {
    // 1. Register a new family/user
    const timestamp = Date.now();
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        family_name: `Calendar Test Family ${timestamp}`,
        email: `calendar-test-${timestamp}@example.com`,
        password: 'testpass123',
        name: 'Calendar User',
      }),
    });

    if (!registerRes.ok) {
      throw new Error('Failed to register test user');
    }

    const data = await registerRes.json() as any;
    authToken = data.token;
    userId = data.user.id;
    familyId = data.user.familyId;
  });

  it('should create a new event', async () => {
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 3600000).toISOString(); // +1 hour

    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: 'E2E Calendar Event',
        start_time: startTime,
        end_time: endTime,
        is_all_day: false,
        user_id: userId,
      }),
    });

    expect(res.status).toBe(201);
    const event = await res.json() as any;
    expect(event.title).toBe('E2E Calendar Event');
    expect(event.user_id).toBe(userId);
  });

  it('should fetch events for the calendar view', async () => {
    // Simulating fetching events for the current month
    // Assuming the API supports syncing or listing events
    // Since this is a sync-first app, we might be hitting the sync endpoint or a list endpoint
    // Let's assume a standard REST endpoint for now based on typical patterns, 
    // or check if there is a specific sync endpoint used.
    // Based on `sync.test.ts`, it likely uses WatermelonDB sync.
    // But for E2E verification of data persistence, we can check if the event exists.

    const res = await fetch(`${API_URL}/events`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(res.status).toBe(200);
    const events = await res.json() as any[];
    const createdEvent = events.find((e: any) => e.title === 'E2E Calendar Event');
    expect(createdEvent).toBeDefined();
  });
});
