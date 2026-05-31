import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeliverableReviewNotes1779767000000 implements MigrationInterface {
  name = 'AddDeliverableReviewNotes1779767000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'deliverable_reviews',
      new TableColumn({
        name: 'notes',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('deliverable_reviews', 'notes');
  }
}
