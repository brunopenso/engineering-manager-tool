import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ElevatedRoleType, RoleChangeAction } from '../../auth/types.js';
import { User } from './User.js';

@Entity({ name: 'role_assignment_events' })
export class RoleAssignmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'target_user_id' })
  targetUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser!: User;

  @Column({ type: 'uuid', name: 'actor_user_id' })
  actorUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser!: User;

  @Column({ type: 'varchar' })
  role!: ElevatedRoleType;

  @Column({ type: 'varchar' })
  action!: RoleChangeAction;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
