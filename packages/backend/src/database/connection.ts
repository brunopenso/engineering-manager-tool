import 'reflect-metadata';
import { DataSource } from 'typeorm';
import ormConfig from './ormconfig.js';

export const AppDataSource = new DataSource(ormConfig);

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized successfully');
  } catch (error) {
    console.error('Error initializing database connection:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
