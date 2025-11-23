import { describe, it, expect } from 'vitest';
import { toWatermelon } from '../../src/sync/pull.js';

describe('toWatermelon', () => {
  it('should format Date objects to YYYY-MM-DD using UTC', () => {
    // Create a date that is different in UTC vs Local
    // e.g. 2023-11-22 00:00:00 UTC
    // In EST (UTC-5), this is 2023-11-21 19:00:00
    const date = new Date('2023-11-22T00:00:00.000Z');
    
    const record = {
      id: '123',
      date: date
    };

    const result = toWatermelon(record);
    // Should be 2023-11-22, NOT 2023-11-21
    expect(result['date']).toBe('2023-11-22');
  });

  it('should handle string dates correctly', () => {
    const record = {
      id: '123',
      date: '2023-11-22'
    };
    const result = toWatermelon(record);
    expect(result['date']).toBe('2023-11-22');
  });
});
