/**
 * Converts a date to a local ISO date string (YYYY-MM-DD)
 * This is useful for HTML date inputs which expect YYYY-MM-DD but use local time
 */
export const toLocalDateISOString = (date: Date): string => {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};
