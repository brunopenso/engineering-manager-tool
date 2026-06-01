import type { BusinessImpact } from '../database/entities/Deliverable.js';
import type { DeliverableListFilters } from '../types/deliverableListFilters.js';
import {
  DeliverableValidationError,
  validateBusinessImpact,
} from './deliverableValidation.js';
import { TeamDeliverablesDateError, validateDateRange } from './teamDeliverablesDate.js';

function formatUtcDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultLast30DayRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 29);

  return {
    startDate: formatUtcDateInput(start),
    endDate: formatUtcDateInput(end),
  };
}

function normalizeQueryValues(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseBusinessImpacts(raw: string | string[] | undefined): BusinessImpact[] | undefined {
  const values = normalizeQueryValues(raw)
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.length === 0) {
    return undefined;
  }

  return values.map((value) => validateBusinessImpact(value));
}

function parseSystemTagIds(raw: string | string[] | undefined): string[] | undefined {
  const values = normalizeQueryValues(raw)
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.length === 0) {
    return undefined;
  }

  return [...new Set(values)];
}

export function parseDeliverableListFilters(query: {
  startDate?: string;
  endDate?: string;
  businessImpact?: string | string[];
  systemTagIds?: string | string[];
}): DeliverableListFilters {
  const defaults = defaultLast30DayRange();
  const startDate = (query.startDate?.trim() || defaults.startDate).slice(0, 10);
  const endDate = (query.endDate?.trim() || defaults.endDate).slice(0, 10);

  try {
    validateDateRange(startDate, endDate);
  } catch (error) {
    if (error instanceof TeamDeliverablesDateError) {
      throw new DeliverableValidationError(error.message);
    }

    throw error;
  }

  let businessImpacts: BusinessImpact[] | undefined;
  try {
    businessImpacts = parseBusinessImpacts(query.businessImpact);
  } catch (error) {
    if (error instanceof DeliverableValidationError) {
      throw error;
    }

    throw error;
  }

  return {
    startDate,
    endDate,
    businessImpacts,
    systemTagIds: parseSystemTagIds(query.systemTagIds),
  };
}

export function resolveCreatedAtBounds(filters: DeliverableListFilters): {
  start: Date;
  end: Date;
} {
  return validateDateRange(filters.startDate, filters.endDate);
}
