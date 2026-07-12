import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('Connected successfully. Reading migration file...');

    const migrationPath1 = path.join(__dirname, 'migrations', '001_init.sql');
    const sql1 = fs.readFileSync(migrationPath1, 'utf8');
    console.log('Executing migration 001_init.sql...');
    await client.query(sql1);

    const migrationPath2 = path.join(__dirname, 'migrations', '002_add_notes.sql');
    const sql2 = fs.readFileSync(migrationPath2, 'utf8');
    console.log('Executing migration 002_add_notes.sql...');
    await client.query(sql2);

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigration();
