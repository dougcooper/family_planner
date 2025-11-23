import { buildRecurrenceRule } from '../../src/logic/events';

describe('Recurring Events Logic', () => {
  describe('buildRecurrenceRule', () => {
    it('should build a daily recurrence rule', () => {
      const rule = buildRecurrenceRule({
        frequency: 'DAILY',
        count: 5,
      });
      expect(rule).toBe('FREQ=DAILY;COUNT=5');
    });

    it('should build a weekly recurrence rule with specific days', () => {
      const rule = buildRecurrenceRule({
        frequency: 'WEEKLY',
        byDay: ['MO', 'WE', 'FR'],
        count: 10,
      });
      expect(rule).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10');
    });

    it('should build a monthly recurrence rule', () => {
      const rule = buildRecurrenceRule({
        frequency: 'MONTHLY',
        byMonthDay: 15,
        count: 12,
      });
      expect(rule).toBe('FREQ=MONTHLY;BYMONTHDAY=15;COUNT=12');
    });

    it('should build a yearly recurrence rule', () => {
      const rule = buildRecurrenceRule({
        frequency: 'YEARLY',
        byMonth: 12,
        byMonthDay: 25,
        count: 5,
      });
      expect(rule).toBe('FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25;COUNT=5');
    });

    it('should handle interval in recurrence rule', () => {
      const rule = buildRecurrenceRule({
        frequency: 'WEEKLY',
        interval: 2,
        count: 8,
      });
      expect(rule).toBe('FREQ=WEEKLY;INTERVAL=2;COUNT=8');
    });

    it('should handle until date in recurrence rule', () => {
      const untilDate = new Date('2024-12-31T23:59:59Z');
      const rule = buildRecurrenceRule({
        frequency: 'DAILY',
        until: untilDate,
      });
      expect(rule).toBe(`FREQ=DAILY;UNTIL=${untilDate.toISOString()}`);
    });

    it('should build rule with only frequency when no other options provided', () => {
      const rule = buildRecurrenceRule({
        frequency: 'DAILY',
      });
      expect(rule).toBe('FREQ=DAILY');
    });

    it('should skip interval when it is 1', () => {
      const rule = buildRecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        count: 5,
      });
      expect(rule).toBe('FREQ=WEEKLY;COUNT=5');
    });

    it('should handle complex weekly pattern', () => {
      const rule = buildRecurrenceRule({
        frequency: 'WEEKLY',
        interval: 2,
        byDay: ['TU', 'TH'],
        count: 20,
      });
      expect(rule).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=20');
    });

    it('should handle all day options', () => {
      const rule = buildRecurrenceRule({
        frequency: 'WEEKLY',
        byDay: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
        count: 7,
      });
      expect(rule).toBe('FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;COUNT=7');
    });
  });
});
