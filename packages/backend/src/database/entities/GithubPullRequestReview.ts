import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GithubImportedPullRequest } from './GithubImportedPullRequest.js';

@Entity({ name: 'github_pull_request_reviews' })
export class GithubPullRequestReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, name: 'github_review_id' })
  githubReviewId!: string;

  @Column({ type: 'uuid', name: 'pull_request_id' })
  pullRequestId!: string;

  @ManyToOne(() => GithubImportedPullRequest, (pr) => pr.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pull_request_id' })
  pullRequest!: GithubImportedPullRequest;

  @Column({ type: 'varchar', length: 39, name: 'reviewer_github_login' })
  reviewerGithubLogin!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ type: 'varchar', length: 64 })
  state!: string;

  @Column({ type: 'timestamptz', name: 'created_at_github' })
  createdAtGithub!: Date;

  @Column({ type: 'timestamptz', name: 'updated_at_github', nullable: true })
  updatedAtGithub!: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  url!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
