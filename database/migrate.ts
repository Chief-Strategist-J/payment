import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PAYMENT_CONFIG } from '../src/config/env.config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = PAYMENT_CONFIG.db.url;
const pool = new pg.Pool({ connectionString });

pool.on('error', (err: any) => {
  console.warn('[db-migrate] PostgreSQL pool error handled:', err?.message || err);
});

async function connectWithRetry(maxRetries = 10, delayMs = 1500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      client.on('error', (err: any) => {
        console.warn('[db-migrate] PostgreSQL client error handled:', err?.message || err);
      });
      return client;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.log(`[db-migrate] Waiting for database readiness (attempt ${attempt}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('[db-migrate] Unable to connect to database after maximum retries');
}

export async function runMigrations() {
  let client: pg.PoolClient | null = null;
  try {
    client = await connectWithRetry();
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
    const appliedSet = new Set(rows.map((r) => r.name));

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql') && !f.endsWith('.rollback.sql'))
      .sort();

    console.log(`[db-migrate] Found ${files.length} migration file(s).`);

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  - [SKIP] ${file} (already applied)`);
        continue;
      }

      console.log(`  - [APPLY] ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  - [SUCCESS] ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  - [FAILED] ${file}:`, err);
        throw err;
      }
    }

    console.log('[db-migrate] All migrations applied successfully.');
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().catch((err) => {
    console.error('[db-migrate] Fatal migration error:', err);
    process.exit(1);
  });
}
