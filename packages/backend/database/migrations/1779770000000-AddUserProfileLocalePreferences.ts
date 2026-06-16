import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_DATE_FORMAT_PREFERENCE, DEFAULT_LANGUAGE_PREFERENCE } from '../../src/types/profilePreferences.js';

export class AddUserProfileLocalePreferences1779770000000 implements MigrationInterface {
  name = 'AddUserProfileLocalePreferences1779770000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS language_preference varchar(10) NOT NULL DEFAULT '${DEFAULT_LANGUAGE_PREFERENCE}'
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS date_format_preference varchar(3) NOT NULL DEFAULT '${DEFAULT_DATE_FORMAT_PREFERENCE}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS date_format_preference
    `);

    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS language_preference
    `);
  }
}
