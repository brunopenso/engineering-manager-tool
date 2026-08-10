import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddUserLeaderRelationship1779765000000 implements MigrationInterface {
  name = 'AddUserLeaderRelationship1779765000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS leader_id uuid NULL
    `);

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['leader_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_creation_audits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'created_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'creator_leader_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_creation_audits',
      new TableForeignKey({
        columnNames: ['created_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_creation_audits',
      new TableForeignKey({
        columnNames: ['creator_leader_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_creation_audits');
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS leader_id
    `);
  }
}
