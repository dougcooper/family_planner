/**
 * Date utility functions for consistent date handling across the app
 */

/**
 * Formats a date object to YYYY-MM-DD string using local time
 * This is crucial for ensuring dates are saved consistently regardless of time of day
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the Monday of the week for a given date
 */
export const getStartOfWeek = (date: Date = new Date()): Date => {
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start on Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Returns the start of the day (00:00:00) timestamp for a given date
 */
export const getStartOfDay = (date: Date = new Date()): number => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
};

/**
 * Returns the end of the day (23:59:59.999) timestamp for a given date
 */
export const getEndOfDay = (date: Date = new Date()): number => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
};
