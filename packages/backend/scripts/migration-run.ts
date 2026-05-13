import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../src/database/connection.js';

dotenv.config();

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations ran successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
