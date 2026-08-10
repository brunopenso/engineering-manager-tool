import { Octokit } from '@octokit/rest';

export type GithubMergedPullRequestHit = {
  organization: string;
  repository: string;
  repositoryId: string;
  number: number;
  githubPullRequestId: string;
};

export type GithubPullRequestDetails = {
  githubPullRequestId: string;
  organization: string;
  repository: string;
  repositoryId: string;
  title: string;
  body: string | null;
  number: number;
  changedFilesCount: number;
  additionsCount: number;
  deletionsCount: number;
  sourceBranch: string;
  targetBranch: string;
  authorGithubLogin: string;
  mergedAt: Date;
  url: string | null;
};

export type GithubIssueComment = {
  githubCommentId: string;
  authorGithubLogin: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  url: string | null;
};

export type GithubReview = {
  githubReviewId: string;
  reviewerGithubLogin: string;
  body: string | null;
  state: string;
  createdAt: Date;
  updatedAt: Date | null;
  url: string | null;
};

export type SearchMergedPullRequestsInput = {
  authorLogin: string;
  organization: string;
  startDate: string;
  endDate: string;
};

export interface GithubApiClient {
  searchMergedPullRequests(
    input: SearchMergedPullRequestsInput,
  ): Promise<GithubMergedPullRequestHit[]>;
  getPullRequest(
    organization: string,
    repository: string,
    number: number,
  ): Promise<GithubPullRequestDetails>;
  listIssueComments(
    organization: string,
    repository: string,
    number: number,
  ): Promise<GithubIssueComment[]>;
  listReviews(
    organization: string,
    repository: string,
    number: number,
  ): Promise<GithubReview[]>;
}

function parseRepoFullName(fullName: string): { organization: string; repository: string } {
  const [organization, repository] = fullName.split('/');
  if (!organization || !repository) {
    throw new Error(`Unexpected repository full name: ${fullName}`);
  }
  return { organization, repository };
}

export function createOctokitGithubApiClient(token: string): GithubApiClient {
  const octokit = new Octokit({ auth: token });

  return {
    async searchMergedPullRequests(input) {
      const query = [
        'is:pr',
        'is:merged',
        `author:${input.authorLogin}`,
        `org:${input.organization}`,
        `merged:${input.startDate}..${input.endDate}`,
      ].join(' ');

      const hits: GithubMergedPullRequestHit[] = [];
      let page = 1;
      for (;;) {
        const response = await octokit.search.issuesAndPullRequests({
          q: query,
          per_page: 100,
          page,
        });
        for (const item of response.data.items) {
          if (!item.pull_request || !item.repository_url) {
            continue;
          }
          const repoFullName = item.repository_url.replace('https://api.github.com/repos/', '');
          const { organization, repository } = parseRepoFullName(repoFullName);
          hits.push({
            organization,
            repository,
            repositoryId: String(item.id),
            number: item.number,
            githubPullRequestId: String(item.id),
          });
        }
        if (response.data.items.length < 100) {
          break;
        }
        page += 1;
      }
      return hits;
    },

    async getPullRequest(organization, repository, number) {
      const { data } = await octokit.pulls.get({
        owner: organization,
        repo: repository,
        pull_number: number,
      });
      if (!data.merged_at) {
        throw new Error(`Pull request ${organization}/${repository}#${number} is not merged`);
      }
      return {
        githubPullRequestId: String(data.id),
        organization,
        repository,
        repositoryId: String(data.base.repo.id),
        title: data.title,
        body: data.body ?? null,
        number: data.number,
        changedFilesCount: data.changed_files,
        additionsCount: data.additions,
        deletionsCount: data.deletions,
        sourceBranch: data.head.ref,
        targetBranch: data.base.ref,
        authorGithubLogin: data.user?.login ?? '',
        mergedAt: new Date(data.merged_at),
        url: data.html_url ?? null,
      };
    },

    async listIssueComments(organization, repository, number) {
      const comments: GithubIssueComment[] = [];
      let page = 1;
      for (;;) {
        const response = await octokit.issues.listComments({
          owner: organization,
          repo: repository,
          issue_number: number,
          per_page: 100,
          page,
        });
        for (const comment of response.data) {
          comments.push({
            githubCommentId: String(comment.id),
            authorGithubLogin: comment.user?.login ?? '',
            body: comment.body ?? '',
            createdAt: new Date(comment.created_at),
            updatedAt: new Date(comment.updated_at),
            url: comment.html_url ?? null,
          });
        }
        if (response.data.length < 100) {
          break;
        }
        page += 1;
      }
      return comments;
    },

    async listReviews(organization, repository, number) {
      const reviews: GithubReview[] = [];
      let page = 1;
      for (;;) {
        const response = await octokit.pulls.listReviews({
          owner: organization,
          repo: repository,
          pull_number: number,
          per_page: 100,
          page,
        });
        for (const review of response.data) {
          reviews.push({
            githubReviewId: String(review.id),
            reviewerGithubLogin: review.user?.login ?? '',
            body: review.body ?? null,
            state: review.state,
            createdAt: new Date(review.submitted_at ?? new Date().toISOString()),
            updatedAt: null,
            url: review.html_url ?? null,
          });
        }
        if (response.data.length < 100) {
          break;
        }
        page += 1;
      }
      return reviews;
    },
  };
}

export function createGithubApiClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): GithubApiClient {
  const token = env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error('GITHUB_TOKEN is required to query GitHub');
  }
  return createOctokitGithubApiClient(token);
}
