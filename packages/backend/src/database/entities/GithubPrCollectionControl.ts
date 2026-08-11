import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export type GithubPrCollectionStatus = 'success' | 'failed' | 'skipped';

@Entity({ name: 'github_pr_collection_controls' })
@Unique('UQ_github_pr_collection_controls_repo_pr', ['repositoryId', 'githubPullRequestId'])
export class GithubPrCollectionControl {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, name: 'repository_id' })
  repositoryId!: string;

  @Column({ type: 'varchar', length: 64, name: 'github_pull_request_id' })
  githubPullRequestId!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: GithubPrCollectionStatus;

  @Column({ type: 'timestamptz', name: 'executed_at' })
  executedAt!: Date;

  @Column({ type: 'text', name: 'error_details', nullable: true })
  errorDetails!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
