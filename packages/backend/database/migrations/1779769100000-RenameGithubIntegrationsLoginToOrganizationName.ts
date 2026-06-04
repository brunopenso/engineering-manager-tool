import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameGithubIntegrationsLoginToOrganizationName1779769100000
  implements MigrationInterface
{
  name = 'RenameGithubIntegrationsLoginToOrganizationName1779769100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('github_integrations');
    const loginColumn = table?.findColumnByName('login');

    if (!loginColumn) {
      return;
    }

    await queryRunner.query('DROP INDEX IF EXISTS "UQ_github_integrations_login"');
    await queryRunner.renameColumn('github_integrations', 'login', 'organization_name');
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_github_integrations_organization_name" ON "github_integrations" ("organization_name")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('github_integrations');
    const organizationNameColumn = table?.findColumnByName('organization_name');

    if (!organizationNameColumn) {
      return;
    }

    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_github_integrations_organization_name"',
    );
    await queryRunner.renameColumn('github_integrations', 'organization_name', 'login');
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_github_integrations_login" ON "github_integrations" ("login")',
    );
  }
}
