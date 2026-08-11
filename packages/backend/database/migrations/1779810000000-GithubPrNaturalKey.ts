import { MigrationInterface, QueryRunner, Table, TableUnique } from 'typeorm';

export class GithubPrNaturalKey1779810000000 implements MigrationInterface {
  name = 'GithubPrNaturalKey1779810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const prTable = await queryRunner.getTable('github_imported_pull_requests');
    if (prTable) {
      const collaboratorFk = prTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('collaborator_id'),
      );
      if (collaboratorFk) {
        await queryRunner.dropForeignKey('github_imported_pull_requests', collaboratorFk);
      }

      const singlePrIdUnique = prTable.uniques.find(
        (unique) =>
          unique.columnNames.length === 1 && unique.columnNames[0] === 'github_pull_request_id',
      );
      if (singlePrIdUnique) {
        await queryRunner.dropUniqueConstraint('github_imported_pull_requests', singlePrIdUnique);
      }

      if (prTable.findColumnByName('collaborator_id')) {
        await queryRunner.dropColumn('github_imported_pull_requests', 'collaborator_id');
      }

      await queryRunner.createUniqueConstraint(
        'github_imported_pull_requests',
        new TableUnique({
          name: 'UQ_github_imported_pull_requests_repo_pr',
          columnNames: ['repository_id', 'github_pull_request_id'],
        }),
      );
    }

    await queryRunner.dropTable('github_pr_collection_controls', true);
    await queryRunner.createTable(
      new Table({
        name: 'github_pr_collection_controls',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'repository_id',
            type: 'varchar',
            length: 64,
            isNullable: false,
          },
          {
            name: 'github_pull_request_id',
            type: 'varchar',
            length: 64,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: 32,
            isNullable: false,
          },
          {
            name: 'executed_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'error_details',
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
        uniques: [
          new TableUnique({
            name: 'UQ_github_pr_collection_controls_repo_pr',
            columnNames: ['repository_id', 'github_pull_request_id'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('github_pr_collection_controls', true);

    const prTable = await queryRunner.getTable('github_imported_pull_requests');
    if (prTable) {
      const naturalKeyUnique = prTable.uniques.find(
        (unique) => unique.name === 'UQ_github_imported_pull_requests_repo_pr',
      );
      if (naturalKeyUnique) {
        await queryRunner.dropUniqueConstraint('github_imported_pull_requests', naturalKeyUnique);
      }
    }

    await queryRunner.query(`
      ALTER TABLE "github_imported_pull_requests"
      ADD COLUMN IF NOT EXISTS "collaborator_id" uuid
    `);
    await queryRunner.createUniqueConstraint(
      'github_imported_pull_requests',
      new TableUnique({
        name: 'UQ_github_imported_pull_requests_github_pr_id',
        columnNames: ['github_pull_request_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'github_pr_collection_controls',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'collaborator_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'github_login',
            type: 'varchar',
            length: 39,
            isNullable: false,
          },
          {
            name: 'organization',
            type: 'varchar',
            length: 39,
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: 32,
            isNullable: false,
          },
          {
            name: 'executed_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'error_details',
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
        uniques: [
          new TableUnique({
            name: 'UQ_github_pr_collection_controls_period',
            columnNames: ['collaborator_id', 'organization', 'start_date', 'end_date'],
          }),
        ],
      }),
      true,
    );
  }
}
