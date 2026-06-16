export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultLast30DayRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 29);

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
}

export function defaultLast60DayRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 59);

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
}

export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) {
    return false;
  }

  return startDate <= endDate;
}
