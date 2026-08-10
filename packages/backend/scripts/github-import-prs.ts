// Load environment variables before database connection
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

import 'reflect-metadata';

import {
  GithubPrImportDateRangeError,
  parseImportCliArgs,
  resolveImportDateRange,
} from '../src/services/githubPrImportDateRange.js';
import { runGithubPrImport } from '../src/services/githubPrImportService.js';

function printHelp(): void {
  console.log(`Usage: npm run github:import-prs -- [--start YYYY-MM-DD] [--end YYYY-MM-DD]

Imports merged GitHub pull requests for collaborators with a githubLogin across
enabled github_integrations organizations.

Defaults to the previous UTC calendar day when dates are omitted.
Requires GITHUB_TOKEN and database configuration in packages/backend/.env.
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let parsed;
  try {
    parsed = parseImportCliArgs(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  if (parsed.help) {
    printHelp();
    return;
  }

  let range;
  try {
    range = resolveImportDateRange(parsed.startDate, parsed.endDate);
  } catch (error) {
    if (error instanceof GithubPrImportDateRangeError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const { AppDataSource, initializeDatabase } = await import('../src/database/connection.js');

  try {
    await initializeDatabase();
    console.log(`Importing GitHub PRs for ${range.startDate} .. ${range.endDate} (UTC)`);
    const summary = await runGithubPrImport(range);
    console.log(
      JSON.stringify(
        {
          range,
          processed: summary.processed,
          succeeded: summary.succeeded,
          skipped: summary.skipped,
          failed: summary.failed,
          pullRequestsImported: summary.pullRequestsImported,
          failures: summary.failures,
        },
        null,
        2,
      ),
    );
    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
