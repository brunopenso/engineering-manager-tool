export type PullRequestClassificationType = 'feature' | 'fix' | 'documentation';

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
  { pattern: /^(feat|feature)(\b|[/_(:-]|$)/i, type: 'feature' },
];

const KEYWORD_TO_TYPE: Array<{ pattern: RegExp; type: PullRequestClassificationType }> = [
  { pattern: /\b(docs?|documentation|readme)\b/i, type: 'documentation' },
  { pattern: /\b(fix|bugfixes?|bugs?|hotfixes?|patches?)\b/i, type: 'fix' },
  { pattern: /\b(features?|feats?|enhance(?:ment)?s?)\b/i, type: 'feature' },
];

function matchPrefix(text: string): PullRequestClassificationType | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? trimmed;
  const firstSegment = firstLine.split(/[/_-]/, 1)[0]?.trim() ?? '';
  const candidates = firstSegment && firstSegment !== firstLine ? [firstLine, firstSegment] : [firstLine];

  for (const candidate of candidates) {
    for (const { pattern, type } of PREFIX_TO_TYPE) {
      if (pattern.test(candidate)) {
        return type;
      }
    }
  }

  // Conventional commit with optional scope: feat(api): ...
  const conventional = firstLine.match(
    /^(feat|feature|fix|bugfix|bug|hotfix|docs|doc|documentation)(\([^)]*\))?\s*:/i,
  );
  if (conventional) {
    const token = conventional[1].toLowerCase();
    if (token === 'docs' || token === 'doc' || token === 'documentation') {
      return 'documentation';
    }
    if (token === 'fix' || token === 'bugfix' || token === 'bug' || token === 'hotfix') {
      return 'fix';
    }
    return 'feature';
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
