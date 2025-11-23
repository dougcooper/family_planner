import { describe, it, expect } from '@jest/globals';
import { getStartOfWeek, formatDateToYYYYMMDD } from '../../src/logic/date';

describe('Frontend Date Logic', () => {
  it('should generate correct YYYY-MM-DD string for local date', () => {
    const date = new Date(2023, 10, 22); // Nov 22, 2023 (Month is 0-indexed)
    const result = formatDateToYYYYMMDD(date);
    expect(result).toBe('2023-11-22');
  });

  it('should calculate start of week (Monday) correctly', () => {
    // Wednesday Nov 22, 2023
    const wednesday = new Date(2023, 10, 22); 
    const monday = getStartOfWeek(wednesday);
    
    expect(monday.getDay()).toBe(1); // Monday
    expect(formatDateToYYYYMMDD(monday)).toBe('2023-11-20'); // Monday Nov 20
  });

  it('should calculate start of week correctly when today is Sunday', () => {
    // Sunday Nov 26, 2023
    const sunday = new Date(2023, 10, 26);
    const monday = getStartOfWeek(sunday);
    
    expect(monday.getDay()).toBe(1); // Monday
    expect(formatDateToYYYYMMDD(monday)).toBe('2023-11-20'); // Previous Monday
  });

  it('should calculate start of week correctly when today is Monday', () => {
    // Monday Nov 20, 2023
    const monday = new Date(2023, 10, 20);
    const start = getStartOfWeek(monday);
    
    expect(start.getDay()).toBe(1); // Monday
    expect(formatDateToYYYYMMDD(start)).toBe('2023-11-20'); // Same day
  });
});
