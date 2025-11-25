import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseRecurrenceRule,
  generateEventInstances,
  createRecurringEvent,
  type CreateRecurringEventParams,
} from '../src/services/recurring-events.js';

// Mock DB
const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock('../src/db/index.js', () => ({
  db: mockDb,
}));

describe('Recurring Events Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseRecurrenceRule', () => {
    it('should parse a daily recurrence rule', () => {
      const rule = parseRecurrenceRule('FREQ=DAILY');
      expect(rule).toEqual({
        frequency: 'DAILY',
      });
    });

    it('should parse a weekly recurrence rule with specific days', () => {
      const rule = parseRecurrenceRule('FREQ=WEEKLY;BYDAY=MO,WE,FR');
      expect(rule).toEqual({
        frequency: 'WEEKLY',
        byDay: ['MO', 'WE', 'FR'],
      });
    });

    it('should parse a monthly recurrence rule with day of month', () => {
      const rule = parseRecurrenceRule('FREQ=MONTHLY;BYMONTHDAY=15');
      expect(rule).toEqual({
        frequency: 'MONTHLY',
        byMonthDay: 15,
      });
    });

    it('should parse a yearly recurrence rule', () => {
      const rule = parseRecurrenceRule('FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25');
      expect(rule).toEqual({
        frequency: 'YEARLY',
        byMonth: 12,
        byMonthDay: 25,
      });
    });

    it('should parse a rule with COUNT', () => {
      const rule = parseRecurrenceRule('FREQ=DAILY;COUNT=10');
      expect(rule).toEqual({
        frequency: 'DAILY',
        count: 10,
      });
    });

    it('should parse a rule with INTERVAL', () => {
      const rule = parseRecurrenceRule('FREQ=WEEKLY;INTERVAL=2');
      expect(rule).toEqual({
        frequency: 'WEEKLY',
        interval: 2,
      });
    });

    it('should return null for invalid rule', () => {
      const rule = parseRecurrenceRule('INVALID');
      expect(rule).toBeNull();
    });

    it('should return null for empty rule', () => {
      const rule = parseRecurrenceRule('');
      expect(rule).toBeNull();
    });
  });

  describe('generateEventInstances', () => {
    it('should generate daily event instances', () => {
      const baseEvent: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'Daily Standup',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T09:30:00Z'),
        recurrenceRule: 'FREQ=DAILY;COUNT=5',
      };

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-10T23:59:59Z');

      const instances = generateEventInstances(baseEvent, startDate, endDate);

      expect(instances).toHaveLength(5);
      expect(instances[0].startTime.toISOString()).toBe('2024-01-01T09:00:00.000Z');
      expect(instances[1].startTime.toISOString()).toBe('2024-01-02T09:00:00.000Z');
      expect(instances[4].startTime.toISOString()).toBe('2024-01-05T09:00:00.000Z');
    });

    it('should generate weekly event instances on specific days', () => {
      const baseEvent: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'Yoga Class',
        startTime: new Date('2024-01-01T18:00:00Z'), // Monday
        endTime: new Date('2024-01-01T19:00:00Z'),
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6',
      };

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      const instances = generateEventInstances(baseEvent, startDate, endDate);

      // Should generate Monday, Wednesday, Friday instances
      expect(instances.length).toBeGreaterThan(0);
      
      // Verify first instance is Monday
      expect(instances[0].startTime.getDay()).toBe(1); // Monday
    });

    it('should generate monthly event instances', () => {
      const baseEvent: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'Monthly Review',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=15;COUNT=3',
      };

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');

      const instances = generateEventInstances(baseEvent, startDate, endDate);

      expect(instances).toHaveLength(3);
      expect(instances[0].startTime.getDate()).toBe(15);
      expect(instances[1].startTime.getDate()).toBe(15);
      expect(instances[2].startTime.getDate()).toBe(15);
    });

    it('should respect interval for weekly recurrence', () => {
      const baseEvent: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'Bi-weekly Meeting',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;COUNT=4',
      };

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');

      const instances = generateEventInstances(baseEvent, startDate, endDate);

      expect(instances).toHaveLength(4);
      // Check that instances are 2 weeks apart
      const day1 = instances[0].startTime.getDate();
      const day2 = instances[1].startTime.getDate();
      expect(Math.abs(day2 - day1)).toBe(14);
    });

    it('should return single instance for non-recurring event', () => {
      const baseEvent: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'One-time Meeting',
        startTime: new Date('2024-01-15T14:00:00Z'),
        endTime: new Date('2024-01-15T15:00:00Z'),
      };

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');

      const instances = generateEventInstances(baseEvent, startDate, endDate);

      expect(instances).toHaveLength(1);
      expect(instances[0].title).toBe('One-time Meeting');
    });

    it('should return empty array when event is outside date range', () => {
      const baseEvent: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'Future Event',
        startTime: new Date('2025-01-01T14:00:00Z'),
        endTime: new Date('2025-01-01T15:00:00Z'),
      };

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');

      const instances = generateEventInstances(baseEvent, startDate, endDate);

      expect(instances).toHaveLength(0);
    });

    it('should maintain event duration for all instances', () => {
      const baseEvent: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: '90-minute Workshop',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:30:00Z'), // 90 minutes
        recurrenceRule: 'FREQ=DAILY;COUNT=3',
      };

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');

      const instances = generateEventInstances(baseEvent, startDate, endDate);

      instances.forEach(instance => {
        const duration = instance.endTime.getTime() - instance.startTime.getTime();
        expect(duration).toBe(90 * 60 * 1000); // 90 minutes in milliseconds
      });
    });
  });

  describe('createRecurringEvent', () => {
    it('should create recurring event instances in database', async () => {
      const params: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'Team Meeting',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        recurrenceRule: 'FREQ=WEEKLY;COUNT=4',
      };

      const mockEvents = [
        { id: 'event-1' },
        { id: 'event-2' },
        { id: 'event-3' },
        { id: 'event-4' },
      ];

      mockDb.returning.mockResolvedValueOnce(mockEvents);

      const result = await createRecurringEvent(params);

      expect(result.success).toBe(true);
      expect(result.eventIds).toHaveLength(4);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const params: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'Team Meeting',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        recurrenceRule: 'FREQ=WEEKLY;COUNT=4',
      };

      mockDb.returning.mockRejectedValueOnce(new Error('Database error'));

      const result = await createRecurringEvent(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.eventIds).toHaveLength(0);
    });

    it('should fail when no instances are generated', async () => {
      const params: CreateRecurringEventParams = {
        familyId: 'family-123',
        title: 'Invalid Event',
        startTime: new Date('2025-01-01T10:00:00Z'), // Future date
        endTime: new Date('2025-01-01T11:00:00Z'),
        recurrenceRule: 'FREQ=DAILY;COUNT=5',
      };

      const result = await createRecurringEvent(
        params,
        new Date('2024-12-31T23:59:59Z') // Generate only until end of 2024 (before event starts)
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No event instances generated');
    });
  });
});
