import type { BusinessImpactLevel } from '../../services/leaderAnalyticsApi.js';

export const BUSINESS_IMPACT_LEVELS: BusinessImpactLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'TRANSFORMATIONAL',
];

export const BUSINESS_IMPACT_LABELS: Record<BusinessImpactLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  TRANSFORMATIONAL: 'Transformational',
};

/** Matches MUI X default series order for stacked impact chart */
export const BUSINESS_IMPACT_COLORS: Record<BusinessImpactLevel, string> = {
  LOW: '#1976d2',
  MEDIUM: '#2e7d32',
  HIGH: '#ed6c02',
  TRANSFORMATIONAL: '#9c27b0',
};
