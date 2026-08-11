export type PullRequestClassificationType = 'feature' | 'fix' | 'documentation' | 'maintenance';

export const PULL_REQUEST_CLASSIFICATION_TYPES: readonly PullRequestClassificationType[] = [
  'feature',
  'fix',
  'documentation',
  'maintenance',
] as const;

export type ClassifyPullRequestTypeInput = {
  sourceBranch: string;
  title: string;
  body: string | null;
};

export type ComplexityMetrics = {
  changedFilesCount: number;
  additionsCount: number;
  deletionsCount: number;
};

const PREFIX_TO_TYPE: Array<{ pattern: RegExp; type: PullRequestClassificationType }> = [
  { pattern: /^(docs|doc|documentation)(\b|[/_(:-]|$)/i, type: 'documentation' },
  { pattern: /^(fix|bugfix|bug|hotfix)(\b|[/_(:-]|$)/i, type: 'fix' },
  {
    pattern: /^(chore|deps|dependencies|maintenance|bump|upgrade)(\b|[/_(:-]|$)/i,
    type: 'maintenance',
  },
  { pattern: /^(feat|feature)(\b|[/_(:-]|$)/i, type: 'feature' },
];

const KEYWORD_TO_TYPE: Array<{ pattern: RegExp; type: PullRequestClassificationType }> = [
  { pattern: /\b(docs?|documentation|readme)\b/i, type: 'documentation' },
  { pattern: /\b(fix|bugfixes?|bugs?|hotfixes?|patches?)\b/i, type: 'fix' },
  {
    pattern:
      /\b(maintenance|dependencies|dependency|dependabot|renovate|upgrad(?:e|es|ing)|bump(?:s|ed|ing)?|libraries|libs)\b/i,
    type: 'maintenance',
  },
  { pattern: /\b(features?|feats?|enhance(?:ment)?s?)\b/i, type: 'feature' },
];

function classificationFromToken(token: string): PullRequestClassificationType | null {
  const normalized = token.toLowerCase();
  if (normalized === 'docs' || normalized === 'doc' || normalized === 'documentation') {
    return 'documentation';
  }
  if (
    normalized === 'fix' ||
    normalized === 'bugfix' ||
    normalized === 'bug' ||
    normalized === 'hotfix'
  ) {
    return 'fix';
  }
  if (
    normalized === 'chore' ||
    normalized === 'deps' ||
    normalized === 'dependencies' ||
    normalized === 'maintenance' ||
    normalized === 'bump' ||
    normalized === 'upgrade'
  ) {
    return 'maintenance';
  }
  if (normalized === 'feat' || normalized === 'feature') {
    return 'feature';
  }
  return null;
}

function matchPrefix(text: string): PullRequestClassificationType | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? trimmed;
  const firstSegment = firstLine.split(/[/_-]/, 1)[0]?.trim() ?? '';
  const candidates =
    firstSegment && firstSegment !== firstLine ? [firstLine, firstSegment] : [firstLine];

  for (const candidate of candidates) {
    for (const { pattern, type } of PREFIX_TO_TYPE) {
      if (pattern.test(candidate)) {
        return type;
      }
    }
  }

  // Conventional commit with optional scope: feat(api): ... / chore(deps): ...
  const conventional = firstLine.match(
    /^(feat|feature|fix|bugfix|bug|hotfix|docs|doc|documentation|chore|deps|dependencies|maintenance|bump|upgrade|build)(\([^)]*\))?\s*:/i,
  );
  if (conventional) {
    const token = conventional[1].toLowerCase();
    const scope = conventional[2]?.toLowerCase() ?? '';
    if (token === 'build') {
      return scope.includes('deps') || scope.includes('dependencies') ? 'maintenance' : null;
    }
    return classificationFromToken(conventional[1]) ?? 'feature';
  }

  return null;
}

function matchKeywords(text: string): PullRequestClassificationType | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  for (const { pattern, type } of KEYWORD_TO_TYPE) {
    if (pattern.test(trimmed)) {
      return type;
    }
  }
  return null;
}

function classifySource(text: string | null | undefined): PullRequestClassificationType | null {
  if (!text) {
    return null;
  }
  return matchPrefix(text) ?? matchKeywords(text);
}

export function classifyPullRequestType(
  input: ClassifyPullRequestTypeInput,
): PullRequestClassificationType {
  return (
    classifySource(input.sourceBranch) ??
    classifySource(input.title) ??
    classifySource(input.body) ??
    'feature'
  );
}

export function computeComplexityIndex(metrics: ComplexityMetrics): number {
  const files = Math.max(0, metrics.changedFilesCount);
  const lines = Math.max(0, metrics.additionsCount) + Math.max(0, metrics.deletionsCount);

  if (lines >= 1000 || files >= 40) {
    return 5;
  }
  if (lines >= 400 || files >= 20) {
    return 4;
  }
  if (lines >= 100 || files >= 8) {
    return 3;
  }
  if (lines >= 30 || files >= 3) {
    return 2;
  }
  return 1;
}

export function classificationFieldsForDetails(input: {
  sourceBranch: string;
  title: string;
  body: string | null;
  changedFilesCount: number;
  additionsCount: number;
  deletionsCount: number;
}): {
  classificationType: PullRequestClassificationType;
  complexityIndex: number;
} {
  return {
    classificationType: classifyPullRequestType({
      sourceBranch: input.sourceBranch,
      title: input.title,
      body: input.body,
    }),
    complexityIndex: computeComplexityIndex({
      changedFilesCount: input.changedFilesCount,
      additionsCount: input.additionsCount,
      deletionsCount: input.deletionsCount,
    }),
  };
}
