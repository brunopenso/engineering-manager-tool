import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class AddUserRolesAndRoleAssignmentEvents1779755677610
  implements MigrationInterface
{
  name = 'AddUserRolesAndRoleAssignmentEvents1779755677610';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
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
            name: 'role',
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

    await queryRunner.createUniqueConstraint(
      'user_roles',
      new TableUnique({
        name: 'UQ_user_roles_user_id_role',
        columnNames: ['user_id', 'role'],
      }),
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'role_assignment_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'target_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'actor_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'action',
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
      'role_assignment_events',
      new TableForeignKey({
        columnNames: ['target_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'role_assignment_events',
      new TableForeignKey({
        columnNames: ['actor_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      INSERT INTO user_roles (user_id, role, created_at)
      SELECT u.id, 'COLLABORATOR', NOW()
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = u.id AND ur.role = 'COLLABORATOR'
      )
    `);

    const bootstrapEmails = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    for (const email of bootstrapEmails) {
      await queryRunner.query(
        `
        INSERT INTO user_roles (user_id, role, created_at)
        SELECT u.id, 'ADMINISTRATOR', NOW()
        FROM users u
        WHERE LOWER(u.email) = $1
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = u.id AND ur.role = 'ADMINISTRATOR'
          )
        `,
        [email],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('role_assignment_events');
    await queryRunner.dropTable('user_roles');
  }
}
