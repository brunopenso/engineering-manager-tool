import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfilePreferences1779768000000 implements MigrationInterface {
  name = 'AddUserProfilePreferences1779768000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS theme_preference varchar(5) NOT NULL DEFAULT 'light'
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS github_login varchar(39) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS github_login
    `);

    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS theme_preference
    `);
  }
}
