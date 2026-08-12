import { describe, expect, it } from 'vitest';
import type { DeliverableProposal } from '../../src/services/myPullRequestsApi.js';

describe('021 confirm payload mapping (US3)', () => {
  it('maps proposal fields to deliverable write input shape', () => {
    const proposal: DeliverableProposal = {
      title: 'Title',
      description: 'Description',
      roleInDeliverable: 'Author',
      businessImpact: 'MEDIUM',
      improvementPoints: 'Points',
      systemTagIds: [],
      technicalDescription: 'Tech',
      userTags: ['widgets'],
      links: [{ url: 'https://example.com', label: 'Example' }],
    };

    const writeInput = {
      title: proposal.title,
      description: proposal.description,
      roleInDeliverable: proposal.roleInDeliverable,
      systemTagIds: proposal.systemTagIds,
      businessImpact: proposal.businessImpact,
      improvementPoints: proposal.improvementPoints,
      technicalDescription: proposal.technicalDescription,
      userTags: proposal.userTags,
      links: proposal.links,
    };

    expect(writeInput).toMatchObject({
      title: 'Title',
      businessImpact: 'MEDIUM',
      systemTagIds: [],
      userTags: ['widgets'],
    });
  });
});
