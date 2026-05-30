// This should be loaded first to ensure environment variables are available for the database connection
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
const seedsDir = path.resolve(__dirname, '..', 'database', 'seeds');
const seedFilePattern = /\.seed\.(ts|js)$/;

dotenv.config({ path: envPath });

import 'reflect-metadata';

import type { DatabaseSeed } from '../src/database/seeds.js';

function isDatabaseSeed(value: unknown): value is DatabaseSeed {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const seed = value as Partial<DatabaseSeed>;
  return typeof seed.name === 'string' && typeof seed.run === 'function';
}

async function loadSeedFiles(): Promise<string[]> {
  const entries = await fs.readdir(seedsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && seedFilePattern.test(entry.name))
    .map((entry) => path.join(seedsDir, entry.name))
    .sort();
}

async function importSeed(filePath: string): Promise<DatabaseSeed> {
  const module = await import(pathToFileURL(filePath).href);
  const seed = module.default ?? module.seed;

  if (!isDatabaseSeed(seed)) {
    throw new Error(`Seed file ${path.basename(filePath)} must export a DatabaseSeed as default or named "seed"`);
  }

  return seed;
}

async function runSeeds() {
  try {
    const seedFiles = await loadSeedFiles();

    if (seedFiles.length === 0) {
      console.log(`No seed files found in ${seedsDir}`);
      return;
    }

    const { AppDataSource } = await import('../src/database/connection.js');

    await AppDataSource.initialize();
    console.log(`Running ${seedFiles.length} seed file(s)...`);

    try {
      for (const seedFile of seedFiles) {
        const seed = await importSeed(seedFile);
        console.log(`Running seed: ${seed.name}`);
        await seed.run(AppDataSource);
      }

      console.log('Seeds ran successfully!');
    } finally {
      await AppDataSource.destroy();
    }
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
}

runSeeds();
