import { Client } from 'pg';
import bcrypt from 'bcryptjs';

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database for seeding...');
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('Connected successfully. Seeding admin user...');

    const email = 'admin@jobassist.com';
    const password = 'admin123';
    const name = 'Admin User';
    const role = 'admin';

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const queryText = `
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role;
    `;

    const res = await client.query(queryText, [email, passwordHash, name, role]);

    if (res.rows.length > 0) {
      console.log('Admin user seeded successfully:', res.rows[0]);
    } else {
      console.log('Admin user already exists (skipped insertion).');
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runSeed();
