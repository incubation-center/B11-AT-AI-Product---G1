import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

config({ path: '.env' }); // or .env.local

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const isSupabasePooler = databaseUrl.includes('pooler.supabase.com');
const normalizedDatabaseUrl = (() => {
  if (!isSupabasePooler) return databaseUrl;

  const url = new URL(databaseUrl);
  if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require');
  if (!url.searchParams.has('pgbouncer')) url.searchParams.set('pgbouncer', 'true');
  return url.toString();
})();

const client = postgres(normalizedDatabaseUrl, {
  ssl: 'require',
  // Supabase pooler (PgBouncer) works more reliably without prepared statements.
  prepare: !isSupabasePooler,
  connect_timeout: 15,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export const db = drizzle({ client, schema });
