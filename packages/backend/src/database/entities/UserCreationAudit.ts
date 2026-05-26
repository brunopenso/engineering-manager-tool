import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { User } from './User.js';

@Entity({ name: 'user_creation_audits' })
export class UserCreationAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'created_user_id' })
  createdUserId!: string;

  @ManyToOne(() => User, (user) => user.createdUserAudits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_user_id' })
  createdUser!: User;

  @Column({ type: 'uuid', name: 'creator_leader_user_id' })
  creatorLeaderUserId!: string;

  @ManyToOne(() => User, (user) => user.creatorLeaderAudits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_leader_user_id' })
  creatorLeader!: User;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
