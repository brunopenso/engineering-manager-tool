import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddGithubIntegrations1779769000000 implements MigrationInterface {
  name = 'AddGithubIntegrations1779769000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'github_integrations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'login',
            type: 'varchar',
            length: '39',
            isNullable: false,
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

    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_github_integrations_login" ON "github_integrations" ("login")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('github_integrations');
  }
}
