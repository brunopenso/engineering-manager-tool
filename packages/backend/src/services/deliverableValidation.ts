import { AUTH_ERROR_CODES } from '../auth/types.js';
import type { BusinessImpact } from '../database/entities/Deliverable.js';

const TITLE_MAX = 200;
const TEXT_MAX = 5000;
const ROLE_MAX = 500;
const USER_TAG_MAX = 64;
const LINK_LABEL_MAX = 120;
const MAX_SYSTEM_TAGS = 20;
const MAX_USER_TAGS = 20;
const MAX_LINKS = 20;

const BUSINESS_IMPACTS: BusinessImpact[] = ['LOW', 'MEDIUM', 'HIGH', 'TRANSFORMATIONAL'];

export class DeliverableValidationError extends Error {
  code = AUTH_ERROR_CODES.VALIDATION_ERROR;
}

export class InvalidSystemTagError extends Error {
  code = AUTH_ERROR_CODES.INVALID_SYSTEM_TAG;
}

export type DeliverableWriteInput = {
  title: string;
  description: string;
  roleInDeliverable: string;
  systemTagIds: string[];
  businessImpact: string;
  improvementPoints: string;
  technicalDescription?: string | null;
  userTags?: string[];
  links?: { url: string; label?: string | null }[];
};

export function validateBusinessImpact(value: string): BusinessImpact {
  const normalized = value.trim().toUpperCase();
  if (!BUSINESS_IMPACTS.includes(normalized as BusinessImpact)) {
    throw new DeliverableValidationError(
      'Business impact must be LOW, MEDIUM, HIGH, or TRANSFORMATIONAL.',
    );
  }
  return normalized as BusinessImpact;
}

function validateRequiredText(value: string, fieldName: string, maxLength: number): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new DeliverableValidationError(`${fieldName} is required.`);
  }
  if (trimmed.length > maxLength) {
    throw new DeliverableValidationError(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

function validateOptionalText(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > maxLength) {
    throw new DeliverableValidationError(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

export function validateReferenceUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new DeliverableValidationError('Link URL is required.');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new DeliverableValidationError('Link URL must be a valid http or https URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new DeliverableValidationError('Link URL must use http or https.');
  }

  if (trimmed.length > 2048) {
    throw new DeliverableValidationError('Link URL must be 2048 characters or fewer.');
  }

  return trimmed;
}

export function validateDeliverableWriteInput(input: DeliverableWriteInput): {
  title: string;
  description: string;
  roleInDeliverable: string;
  systemTagIds: string[];
  businessImpact: BusinessImpact;
  improvementPoints: string;
  technicalDescription: string | null;
  userTags: string[];
  links: { url: string; label: string | null }[];
} {
  const title = validateRequiredText(input.title, 'Title', TITLE_MAX);
  const description = validateRequiredText(input.description, 'Description', TEXT_MAX);
  const roleInDeliverable = validateRequiredText(
    input.roleInDeliverable,
    'Role in deliverable',
    ROLE_MAX,
  );
  const improvementPoints = validateRequiredText(
    input.improvementPoints,
    'Improvement points',
    TEXT_MAX,
  );
  const technicalDescription = validateOptionalText(
    input.technicalDescription,
    'Technical description',
    TEXT_MAX,
  );
  const businessImpact = validateBusinessImpact(input.businessImpact);

  if (!Array.isArray(input.systemTagIds) || input.systemTagIds.length === 0) {
    throw new DeliverableValidationError('At least one system tag is required.');
  }

  if (input.systemTagIds.length > MAX_SYSTEM_TAGS) {
    throw new DeliverableValidationError(`At most ${MAX_SYSTEM_TAGS} system tags are allowed.`);
  }

  const systemTagIds = [...new Set(input.systemTagIds.map((id) => id.trim()).filter(Boolean))];
  if (systemTagIds.length === 0) {
    throw new DeliverableValidationError('At least one system tag is required.');
  }

  const userTagsInput = input.userTags ?? [];
  if (userTagsInput.length > MAX_USER_TAGS) {
    throw new DeliverableValidationError(`At most ${MAX_USER_TAGS} user tags are allowed.`);
  }

  const userTags = userTagsInput
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      if (tag.length > USER_TAG_MAX) {
        throw new DeliverableValidationError(
          `User tags must be ${USER_TAG_MAX} characters or fewer.`,
        );
      }
      return tag;
    });

  const linksInput = input.links ?? [];
  if (linksInput.length > MAX_LINKS) {
    throw new DeliverableValidationError(`At most ${MAX_LINKS} links are allowed.`);
  }

  const links = linksInput.map((link) => {
    const url = validateReferenceUrl(link.url);
    const label = link.label ? link.label.trim().slice(0, LINK_LABEL_MAX) : null;
    return { url, label: label || null };
  });

  return {
    title,
    description,
    roleInDeliverable,
    systemTagIds,
    businessImpact,
    improvementPoints,
    technicalDescription,
    userTags,
    links,
  };
}
