import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Deliverable } from './Deliverable.js';

@Entity({ name: 'deliverable_user_tags' })
export class DeliverableUserTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'deliverable_id' })
  deliverableId!: string;

  @ManyToOne(() => Deliverable, (deliverable) => deliverable.userTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable!: Deliverable;

  @Column({ type: 'varchar', length: 64 })
  label!: string;
}
