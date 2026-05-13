import { DataSourceOptions } from 'typeorm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ormConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'engineering_manager_tool',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: [
    path.join(__dirname, 'entities', '*.ts')
  ],
  migrations: [path.join(__dirname, '..', '..', 'database', 'migrations', '*.ts')],
  subscribers: [],
  migrationsRun: false,
  migrationsTableName: 'migrations',
};

console.log(JSON.stringify(ormConfig, null, 2));

export default ormConfig;
