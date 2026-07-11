import { Pool } from 'pg';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
} else {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR.
  const globalWithDb = global as typeof globalThis & {
    _postgresPool?: Pool;
  };

  if (!globalWithDb._postgresPool) {
    globalWithDb._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  pool = globalWithDb._postgresPool;
}

export const db = pool;

// Helper to run raw queries easily
export async function query(text: string, params?: any[]) {
  return db.query(text, params);
}
