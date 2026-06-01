// Date utilities for HRI Project Manager

/**
 * Formats a date string or Date object into YYYY-MM-DD.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string into YYYY-MM-DD hh:mm:ss for historical logs.
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generates a clean date range presentation.
 */
export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  
  if (!startStr && !endStr) return '일정 미정';
  if (startStr && !endStr) return `${startStr} ~`;
  if (!startStr && endStr) return `~ ${endStr}`;
  return `${startStr} ~ ${endStr}`;
}
