import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

console.log('[db] initializing neon client...');
if (!process.env.DATABASE_URL) {
    console.error('[db] DATABASE_URL is missing!');
    // Try to load .env if missing (e.g. running just node)
    try { require('dotenv').config(); } catch (e) { }
}

const connectionString = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;
if (!connectionString) {
    console.error('[db] connection string is still missing after checks.');
} else {
    console.log('[db] Connection string found (length: ' + connectionString.length + ')');
}

const sql = neon(connectionString!);
export const db = drizzle(sql, { schema });
