import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoginAuditEvent } from './LoginAuditEvent.js';
import { UserRole } from './UserRole.js';
import { UserCreationAudit } from './UserCreationAudit.js';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar', name: 'theme_preference', default: 'light' })
  themePreference!: 'light' | 'dark';

  @Column({ type: 'varchar', name: 'github_login', length: 39, nullable: true })
  githubLogin!: string | null;

  @Column({ type: 'varchar', name: 'language_preference', length: 5, default: 'en' })
  languagePreference!: 'en' | 'es' | 'de' | 'fr' | 'pt';

  @Column({ type: 'varchar', name: 'date_format_preference', length: 3, default: 'MDY' })
  dateFormatPreference!: 'MDY' | 'DMY' | 'YMD';

  @Column({ type: 'timestamptz', name: 'first_login_at' })
  firstLoginAt!: Date;

  @Column({ type: 'timestamptz', name: 'last_login_at' })
  lastLoginAt!: Date;

  @Column({ type: 'uuid', name: 'leader_id', nullable: true })
  leaderId!: string | null;

  @ManyToOne(() => User, (user) => user.directReports, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'leader_id' })
  leader!: User | null;

  @OneToMany(() => User, (user) => user.leader)
  directReports!: User[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => LoginAuditEvent, (loginAuditEvent) => loginAuditEvent.user)
  loginAuditEvents!: LoginAuditEvent[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];

  @OneToMany(() => UserCreationAudit, (audit) => audit.createdUser)
  createdUserAudits!: UserCreationAudit[];

  @OneToMany(() => UserCreationAudit, (audit) => audit.creatorLeader)
  creatorLeaderAudits!: UserCreationAudit[];
}
