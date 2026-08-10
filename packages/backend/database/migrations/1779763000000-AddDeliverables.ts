import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddDeliverables1779763000000 implements MigrationInterface {
  name = 'AddDeliverables1779763000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'deliverables',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'role_in_deliverable',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'business_impact',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'improvement_points',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'technical_description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
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

    await queryRunner.createForeignKey(
      'deliverables',
      new TableForeignKey({
        name: 'FK_deliverables_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'deliverables',
      new TableIndex({
        name: 'IDX_deliverables_user_updated',
        columnNames: ['user_id', 'updated_at'],
      }),
    );

    await queryRunner.query(
      `ALTER TABLE "deliverables" ADD CONSTRAINT "CHK_deliverables_business_impact"
       CHECK ("business_impact" IN ('LOW', 'MEDIUM', 'HIGH', 'TRANSFORMATIONAL'))`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'deliverable_system_tags',
        columns: [
          {
            name: 'deliverable_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'tag_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'deliverable_system_tags',
      new TableForeignKey({
        name: 'FK_deliverable_system_tags_deliverable',
        columnNames: ['deliverable_id'],
        referencedTableName: 'deliverables',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'deliverable_system_tags',
      new TableForeignKey({
        name: 'FK_deliverable_system_tags_tag',
        columnNames: ['tag_id'],
        referencedTableName: 'tags',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'deliverable_user_tags',
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
            name: 'label',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'deliverable_user_tags',
      new TableForeignKey({
        name: 'FK_deliverable_user_tags_deliverable',
        columnNames: ['deliverable_id'],
        referencedTableName: 'deliverables',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'deliverable_links',
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
            name: 'url',
            type: 'varchar',
            length: '2048',
            isNullable: false,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'deliverable_links',
      new TableForeignKey({
        name: 'FK_deliverable_links_deliverable',
        columnNames: ['deliverable_id'],
        referencedTableName: 'deliverables',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('deliverable_links');
    await queryRunner.dropTable('deliverable_user_tags');
    await queryRunner.dropTable('deliverable_system_tags');
    await queryRunner.dropTable('deliverables');
  }
}
