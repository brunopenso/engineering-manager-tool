import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User.js';

export type GithubPrCollectionStatus = 'success' | 'failed' | 'skipped';

@Entity({ name: 'github_pr_collection_controls' })
export class GithubPrCollectionControl {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'collaborator_id' })
  collaboratorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collaborator_id' })
  collaborator!: User;

  @Column({ type: 'varchar', length: 39, name: 'github_login' })
  githubLogin!: string;

  @Column({ type: 'varchar', length: 39 })
  organization!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

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
