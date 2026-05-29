import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Deliverable } from './Deliverable.js';
import { User } from './User.js';

@Entity({ name: 'deliverable_reviews' })
export class DeliverableReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'deliverable_id' })
  deliverableId!: string;

  @ManyToOne(() => Deliverable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable!: Deliverable;

  @Column({ type: 'uuid', name: 'reviewer_user_id' })
  reviewerUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_user_id' })
  reviewer!: User;

  @Column({ type: 'boolean', default: true })
  reviewed!: boolean;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
