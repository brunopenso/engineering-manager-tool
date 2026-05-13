import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateMigrationName(baseName: string): string {
  const timestamp = new Date().getTime();
  return `${timestamp}-${baseName}.ts`;
}

async function createMigration() {
  const migrationName = process.argv[2];
  
  if (!migrationName) {
    console.error('Please provide a migration name: npm run db:migration:create -- YourMigrationName');
    process.exit(1);
  }

  try {
    const migrationsDir = path.join(__dirname, '..', '..', '..', 'database', 'migrations');
    const fileName = generateMigrationName(migrationName);
    const filePath = path.join(migrationsDir, fileName);
    
    const template = `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${migrationName}${new Date().getTime()} implements MigrationInterface {
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
