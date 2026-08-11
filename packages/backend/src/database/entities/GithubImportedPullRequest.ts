import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { GithubPullRequestComment } from './GithubPullRequestComment.js';
import { GithubPullRequestReview } from './GithubPullRequestReview.js';

@Entity({ name: 'github_imported_pull_requests' })
@Unique('UQ_github_imported_pull_requests_repo_pr', ['repositoryId', 'githubPullRequestId'])
export class GithubImportedPullRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, name: 'github_pull_request_id' })
  githubPullRequestId!: string;

  @Column({ type: 'varchar', length: 39 })
  organization!: string;

  @Column({ type: 'varchar', length: 255 })
  repository!: string;

  @Column({ type: 'varchar', length: 64, name: 'repository_id' })
  repositoryId!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ type: 'integer' })
  number!: number;

  @Column({ type: 'integer', name: 'changed_files_count', default: 0 })
  changedFilesCount!: number;

  @Column({ type: 'integer', name: 'additions_count', default: 0 })
  additionsCount!: number;

  @Column({ type: 'integer', name: 'deletions_count', default: 0 })
  deletionsCount!: number;

  @Column({ type: 'varchar', length: 255, name: 'source_branch' })
  sourceBranch!: string;

  @Column({ type: 'varchar', length: 255, name: 'target_branch' })
  targetBranch!: string;

  @Column({ type: 'varchar', length: 39, name: 'author_github_login' })
  authorGithubLogin!: string;

  @Column({ type: 'timestamptz', name: 'merged_at' })
  mergedAt!: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  url!: string | null;

  @OneToMany(() => GithubPullRequestComment, (comment) => comment.pullRequest)
  comments!: GithubPullRequestComment[];

  @OneToMany(() => GithubPullRequestReview, (review) => review.pullRequest)
  reviews!: GithubPullRequestReview[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
