import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class AddGithubPullRequestImport1779800000000 implements MigrationInterface {
  name = 'AddGithubPullRequestImport1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'github_imported_pull_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'github_pull_request_id',
            type: 'varchar',
            length: 64,
            isNullable: false,
          },
          {
            name: 'organization',
            type: 'varchar',
            length: 39,
            isNullable: false,
          },
          {
            name: 'repository',
            type: 'varchar',
            length: 255,
            isNullable: false,
          },
          {
            name: 'repository_id',
            type: 'varchar',
            length: 64,
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: 500,
            isNullable: false,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'number',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'changed_files_count',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'additions_count',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'deletions_count',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'source_branch',
            type: 'varchar',
            length: 255,
            isNullable: false,
          },
          {
            name: 'target_branch',
            type: 'varchar',
            length: 255,
            isNullable: false,
          },
          {
            name: 'author_github_login',
            type: 'varchar',
            length: 39,
            isNullable: false,
          },
          {
            name: 'merged_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: 1000,
            isNullable: true,
          },
          {
            name: 'collaborator_id',
            type: 'uuid',
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

    await queryRunner.createUniqueConstraint(
      'github_imported_pull_requests',
      new TableUnique({
        name: 'UQ_github_imported_pull_requests_github_pr_id',
        columnNames: ['github_pull_request_id'],
      }),
    );

    await queryRunner.createIndex(
      'github_imported_pull_requests',
      new TableIndex({
        name: 'IDX_github_imported_prs_author_merged',
        columnNames: ['author_github_login', 'merged_at'],
      }),
    );

    await queryRunner.createForeignKey(
      'github_imported_pull_requests',
      new TableForeignKey({
        columnNames: ['collaborator_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'github_pull_request_comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'github_comment_id',
            type: 'varchar',
            length: 64,
            isNullable: false,
          },
          {
            name: 'pull_request_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'author_github_login',
            type: 'varchar',
            length: 39,
            isNullable: false,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'created_at_github',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'updated_at_github',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: 1000,
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

    await queryRunner.createUniqueConstraint(
      'github_pull_request_comments',
      new TableUnique({
        name: 'UQ_github_pr_comments_github_comment_id',
        columnNames: ['github_comment_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'github_pull_request_comments',
      new TableForeignKey({
        columnNames: ['pull_request_id'],
        referencedTableName: 'github_imported_pull_requests',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'github_pull_request_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'github_review_id',
            type: 'varchar',
            length: 64,
            isNullable: false,
          },
          {
            name: 'pull_request_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewer_github_login',
            type: 'varchar',
            length: 39,
            isNullable: false,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            length: 64,
            isNullable: false,
          },
          {
            name: 'created_at_github',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'updated_at_github',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'url',
            type: 'varchar',
            length: 1000,
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

    await queryRunner.createUniqueConstraint(
      'github_pull_request_reviews',
      new TableUnique({
        name: 'UQ_github_pr_reviews_github_review_id',
        columnNames: ['github_review_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'github_pull_request_reviews',
      new TableForeignKey({
        columnNames: ['pull_request_id'],
        referencedTableName: 'github_imported_pull_requests',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
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
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'github_pr_collection_controls',
      new TableUnique({
        name: 'UQ_github_pr_collection_controls_period',
        columnNames: ['collaborator_id', 'organization', 'start_date', 'end_date'],
      }),
    );

    await queryRunner.createForeignKey(
      'github_pr_collection_controls',
      new TableForeignKey({
        columnNames: ['collaborator_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('github_pr_collection_controls');
    await queryRunner.dropTable('github_pull_request_reviews');
    await queryRunner.dropTable('github_pull_request_comments');
    await queryRunner.dropTable('github_imported_pull_requests');
  }
}
