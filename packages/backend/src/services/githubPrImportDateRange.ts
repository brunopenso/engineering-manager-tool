const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ImportDateRange = {
  startDate: string;
  endDate: string;
};

export class GithubPrImportDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubPrImportDateRangeError';
  }
}

function assertIsoDate(value: string, label: string): void {
  if (!ISO_DATE.test(value)) {
    throw new GithubPrImportDateRangeError(`${label} must be YYYY-MM-DD`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new GithubPrImportDateRangeError(`${label} is not a valid calendar date`);
  }
}

export function previousUtcCalendarDay(now: Date = new Date()): string {
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return utc.toISOString().slice(0, 10);
}

export function resolveImportDateRange(
  startDate?: string | null,
  endDate?: string | null,
  now: Date = new Date(),
): ImportDateRange {
  const hasStart = Boolean(startDate);
  const hasEnd = Boolean(endDate);

  if (hasStart !== hasEnd) {
    throw new GithubPrImportDateRangeError(
      'Both --start and --end are required when either is provided',
    );
  }

  if (!hasStart && !hasEnd) {
    const day = previousUtcCalendarDay(now);
    return { startDate: day, endDate: day };
  }

  const start = String(startDate);
  const end = String(endDate);
  assertIsoDate(start, 'startDate');
  assertIsoDate(end, 'endDate');
  if (end < start) {
    throw new GithubPrImportDateRangeError('endDate must be on or after startDate');
  }
  return { startDate: start, endDate: end };
}

export type ParsedImportCliArgs = {
  startDate?: string;
  endDate?: string;
  help: boolean;
};

export function parseImportCliArgs(argv: string[]): ParsedImportCliArgs {
  const result: ParsedImportCliArgs = { help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
    if (arg === '--start') {
      result.startDate = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--end') {
      result.endDate = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--start=')) {
      result.startDate = arg.slice('--start='.length);
      continue;
    }
    if (arg.startsWith('--end=')) {
      result.endDate = arg.slice('--end='.length);
      continue;
    }
    throw new GithubPrImportDateRangeError(`Unknown argument: ${arg}`);
  }
  return result;
}

export function normalizeGithubLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function githubLoginsMatch(a: string, b: string): boolean {
  return normalizeGithubLogin(a) === normalizeGithubLogin(b);
}
