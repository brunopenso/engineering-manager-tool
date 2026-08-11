import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGithubPrClassifications1779820000000 implements MigrationInterface {
  name = 'AddGithubPrClassifications1779820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'github_imported_pull_requests',
      new TableColumn({
        name: 'classification_type',
        type: 'varchar',
        length: 32,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'github_imported_pull_requests',
      new TableColumn({
        name: 'complexity_index',
        type: 'smallint',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('github_imported_pull_requests', 'complexity_index');
    await queryRunner.dropColumn('github_imported_pull_requests', 'classification_type');
  }
}
