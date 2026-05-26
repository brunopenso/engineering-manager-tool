import { AUTH_ERROR_CODES } from '../auth/types.js';

const TAG_NAME_MAX_LENGTH = 64;
const TAG_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export class TagValidationError extends Error {
  code = AUTH_ERROR_CODES.VALIDATION_ERROR;
}

export class TagDuplicateNameError extends Error {
  code = AUTH_ERROR_CODES.DUPLICATE_TAG_NAME;
}

export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validateTagName(name: string): string {
  const normalized = normalizeTagName(name);

  if (!normalized) {
    throw new TagValidationError('Tag name is required.');
  }

  if (normalized.length > TAG_NAME_MAX_LENGTH) {
    throw new TagValidationError(`Tag name must be ${TAG_NAME_MAX_LENGTH} characters or fewer.`);
  }

  return normalized;
}

export function validateTagColor(color: string): string {
  const normalized = color.trim();

  if (!TAG_COLOR_REGEX.test(normalized)) {
    throw new TagValidationError('Tag color must be a valid hex value like #3F51B5.');
  }

  return normalized.toUpperCase();
}
