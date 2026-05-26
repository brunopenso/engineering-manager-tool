import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User.js';
import { DeliverableLink } from './DeliverableLink.js';
import { DeliverableSystemTag } from './DeliverableSystemTag.js';
import { DeliverableUserTag } from './DeliverableUserTag.js';

export type BusinessImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'TRANSFORMATIONAL';

@Entity({ name: 'deliverables' })
export class Deliverable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 500, name: 'role_in_deliverable' })
  roleInDeliverable!: string;

  @Column({ type: 'varchar', length: 32, name: 'business_impact' })
  businessImpact!: BusinessImpact;

  @Column({ type: 'text', name: 'improvement_points' })
  improvementPoints!: string;

  @Column({ type: 'text', name: 'technical_description', nullable: true })
  technicalDescription!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => DeliverableSystemTag, (row) => row.deliverable, { cascade: true })
  systemTags!: DeliverableSystemTag[];

  @OneToMany(() => DeliverableUserTag, (row) => row.deliverable, { cascade: true })
  userTags!: DeliverableUserTag[];

  @OneToMany(() => DeliverableLink, (row) => row.deliverable, { cascade: true })
  links!: DeliverableLink[];
}
