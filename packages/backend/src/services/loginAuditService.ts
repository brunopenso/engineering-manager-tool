import { AppDataSource } from '../database/connection.js';
import { LoginAuditEvent } from '../database/entities/LoginAuditEvent.js';

const loginAuditRepository = () => AppDataSource.getRepository(LoginAuditEvent);

export async function createSuccessfulLoginAuditEvent(userId: string): Promise<void> {
  const event = loginAuditRepository().create({
    userId,
    loggedInAt: new Date(),
    provider: 'GOOGLE',
  });

  await loginAuditRepository().save(event);
}
