import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../src/database/connection.js';

dotenv.config();

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
