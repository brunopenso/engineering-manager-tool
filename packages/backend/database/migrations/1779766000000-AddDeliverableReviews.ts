import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class AddDeliverableReviews1779766000000 implements MigrationInterface {
  name = 'AddDeliverableReviews1779766000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'deliverable_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'deliverable_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewer_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewed',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'deliverable_reviews',
      new TableUnique({
        name: 'UQ_deliverable_reviews_deliverable_reviewer',
        columnNames: ['deliverable_id', 'reviewer_user_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'deliverable_reviews',
      new TableForeignKey({
        columnNames: ['deliverable_id'],
        referencedTableName: 'deliverables',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'deliverable_reviews',
      new TableForeignKey({
        columnNames: ['reviewer_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('deliverable_reviews');
  }
}
