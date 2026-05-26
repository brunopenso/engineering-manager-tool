import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Deliverable } from './Deliverable.js';

@Entity({ name: 'deliverable_links' })
export class DeliverableLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'deliverable_id' })
  deliverableId!: string;

  @ManyToOne(() => Deliverable, (deliverable) => deliverable.links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable!: Deliverable;

  @Column({ type: 'varchar', length: 2048 })
  url!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  label!: string | null;
}
