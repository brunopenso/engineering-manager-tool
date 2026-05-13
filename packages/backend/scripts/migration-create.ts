// This should be loaded first to ensure environment variables are available for the database connection
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

dotenv.config({ path: envPath });

import 'reflect-metadata';
import fs from 'fs';

function toMigrationClassBase(baseName: string): string {
  return baseName
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function generateTimestamp(): number {
  // TypeORM expects a 13-digit epoch-milliseconds suffix on migration class names.
  return Date.now();
}

async function createMigration() {
  const migrationName = process.argv[2];
  
  if (!migrationName) {
    console.error('Please provide a migration name: npm run db:migration:create -- YourMigrationName');
    process.exit(1);
  }

  try {
    const timestamp = generateTimestamp();
    const migrationClassBase = toMigrationClassBase(migrationName);
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    const fileName = `${new Date().getTime()}-${migrationName}.ts`;
    const filePath = path.join(migrationsDir, fileName);
    
    const template = `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${migrationClassBase}${timestamp} implements MigrationInterface {
    name = '${fileName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add your migration logic here
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add your rollback logic here
    }
}
`;

    fs.writeFileSync(filePath, template);
    console.log(`Migration ${fileName} created successfully at ${filePath}`);
  } catch (error) {
    console.error('Error creating migration:', error);
    process.exit(1);
  }
}

createMigration();
