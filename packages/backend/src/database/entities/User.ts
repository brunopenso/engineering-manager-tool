import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoginAuditEvent } from './LoginAuditEvent.js';
import { UserRole } from './UserRole.js';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', name: 'full_name' })
  fullName!: string;

  @Column({ type: 'timestamptz', name: 'first_login_at' })
  firstLoginAt!: Date;

  @Column({ type: 'timestamptz', name: 'last_login_at' })
  lastLoginAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => LoginAuditEvent, (loginAuditEvent) => loginAuditEvent.user)
  loginAuditEvents!: LoginAuditEvent[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];
}
