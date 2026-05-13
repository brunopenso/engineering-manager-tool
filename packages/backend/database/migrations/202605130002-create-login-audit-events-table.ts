import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLoginAuditEventsTable1747173600002 implements MigrationInterface {
  name = 'CreateLoginAuditEventsTable1747173600002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.createTable(
      new Table({
        name: 'login_audit_events',
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
            name: 'logged_in_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
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
      'login_audit_events',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('login_audit_events');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.includes('user_id'));

    if (foreignKey) {
      await queryRunner.dropForeignKey('login_audit_events', foreignKey);
    }

    await queryRunner.dropTable('login_audit_events');
  }
}
