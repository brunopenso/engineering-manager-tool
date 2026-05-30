import type { DataSource } from 'typeorm';
import { defineSeed } from '../../src/database/seeds.js';

function getApplicationTableNames(dataSource: DataSource): string[] {
  return dataSource.entityMetadatas.map((metadata) => metadata.tableName);
}

export default defineSeed({
  name: 'clear-database',
  async run(dataSource) {
    const tableNames = getApplicationTableNames(dataSource);

    if (tableNames.length === 0) {
      return;
    }

    const quotedTables = tableNames.map((tableName) => `"${tableName}"`).join(', ');

    await dataSource.query(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);
  },
});
