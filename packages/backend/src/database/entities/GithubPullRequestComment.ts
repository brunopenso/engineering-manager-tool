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

@Entity({ name: 'github_pull_request_comments' })
export class GithubPullRequestComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, name: 'github_comment_id' })
  githubCommentId!: string;

  @Column({ type: 'uuid', name: 'pull_request_id' })
  pullRequestId!: string;

  @ManyToOne(() => GithubImportedPullRequest, (pr) => pr.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pull_request_id' })
  pullRequest!: GithubImportedPullRequest;

  @Column({ type: 'varchar', length: 39, name: 'author_github_login' })
  authorGithubLogin!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'timestamptz', name: 'created_at_github' })
  createdAtGithub!: Date;

  @Column({ type: 'timestamptz', name: 'updated_at_github' })
  updatedAtGithub!: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  url!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
