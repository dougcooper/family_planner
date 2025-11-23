import { describe, it, expect } from 'vitest';
import { toWatermelon } from '../src/sync/pull.js';

describe('Backend Date Handling (toWatermelon)', () => {
  it('should convert Date object to YYYY-MM-DD string', () => {
    // Create a date: Nov 22, 2023
    const date = new Date('2023-11-22T12:00:00Z');
    const record = { date };
    const result = toWatermelon(record);
    
    // Note: The implementation uses local time methods (getFullYear, etc.)
    // This test might be flaky depending on the runner's timezone if we use a specific time
    // But since we want to verify the logic itself:
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const expected = `${year}-${month}-${day}`;

    expect(result.date).toBe(expected);
  });

  it('should convert ISO string to YYYY-MM-DD string', () => {
    const record = { date: '2023-11-22T00:00:00.000Z' };
    const result = toWatermelon(record);
    expect(result.date).toBe('2023-11-22');
  });

  it('should keep YYYY-MM-DD string as is', () => {
    const record = { date: '2023-11-22' };
    const result = toWatermelon(record);
    expect(result.date).toBe('2023-11-22');
  });

  it('should handle other timestamps correctly', () => {
    const now = new Date();
    const record = { 
      createdAt: now,
      updatedAt: now,
      startTime: now,
      endTime: now
    };
    const result = toWatermelon(record);
    
    expect(result.created_at).toBe(now.getTime());
    expect(result.updated_at).toBe(now.getTime());
    expect(result.start_time).toBe(now.getTime());
    expect(result.end_time).toBe(now.getTime());
  });
});
