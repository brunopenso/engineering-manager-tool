const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class TeamDeliverablesDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamDeliverablesDateError';
  }
}

export function parseDateParam(value: string, label: string): Date {
  if (!DATE_PATTERN.test(value)) {
    throw new TeamDeliverablesDateError(`${label} must use YYYY-MM-DD format.`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new TeamDeliverablesDateError(`${label} is not a valid date.`);
  }

  return parsed;
}

export function toUtcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

export function toUtcEndOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

export function validateDateRange(startDate: string, endDate: string): {
  start: Date;
  end: Date;
} {
  const start = toUtcStartOfDay(parseDateParam(startDate, 'startDate'));
  const end = toUtcEndOfDay(parseDateParam(endDate, 'endDate'));

  if (start.getTime() > end.getTime()) {
    throw new TeamDeliverablesDateError('endDate must be on or after startDate.');
  }

  return { start, end };
}
