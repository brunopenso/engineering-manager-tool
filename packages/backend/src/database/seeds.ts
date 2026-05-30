import type { DataSource } from 'typeorm';

export interface DatabaseSeed {
  name: string;
  run: (dataSource: DataSource) => Promise<void>;
}

export function defineSeed(seed: DatabaseSeed): DatabaseSeed {
  return seed;
}
