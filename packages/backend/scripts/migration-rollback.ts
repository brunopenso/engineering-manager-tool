// This should be loaded first to ensure environment variables are available for the database connection
// This should be loaded first to ensure environment variables are available for the database connection
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

dotenv.config({ path: envPath });

import 'reflect-metadata';

import { AppDataSource } from '../src/database/connection.js';

async function rollbackMigration() {
  try {
    await AppDataSource.initialize();
    console.log('Rolling back the last migration...');
    await AppDataSource.undoLastMigration();
    console.log('Migration rolled back successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error rolling back migration:', error);
    process.exit(1);
  }
}

rollbackMigration();
