import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Deliverable } from './Deliverable.js';
import { Tag } from './Tag.js';

@Entity({ name: 'deliverable_system_tags' })
export class DeliverableSystemTag {
  @PrimaryColumn({ type: 'uuid', name: 'deliverable_id' })
  deliverableId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'tag_id' })
  tagId!: string;

  @ManyToOne(() => Deliverable, (deliverable) => deliverable.systemTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable!: Deliverable;

  @ManyToOne(() => Tag, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
