// Formatting and statistics utilities for HRI Project Manager

/**
 * Formats a satisfaction score to 1 or 2 decimal places.
 */
export function formatSatisfaction(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0.0';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '0.0';
  return num.toFixed(2);
}

/**
 * Formats standard numbers with thousands separators.
 */
export function formatCount(val: number | null | undefined): string {
  if (val === null || val === undefined) return '0';
  return val.toLocaleString('ko-KR');
}

/**
 * Helper to truncate a long string with ellipses.
 */
export function truncate(str: string, maxLen: number = 24): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}
