import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGithubPrUserReclassification1779830000000 implements MigrationInterface {
  name = 'AddGithubPrUserReclassification1779830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'github_imported_pull_requests',
      new TableColumn({
        name: 'user_reclassification',
        type: 'varchar',
        length: 32,
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE github_imported_pull_requests
      SET user_reclassification = classification_type
      WHERE user_reclassification IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('github_imported_pull_requests', 'user_reclassification');
  }
}
