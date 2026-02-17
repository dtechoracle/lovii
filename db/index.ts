import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

console.log('[db] initializing neon client...');
if (!process.env.DATABASE_URL) {
    console.error('[db] DATABASE_URL is missing!');
    // Try to load .env if missing (e.g. running just node)
    // Force reload .env overriding shell (since shell might have conflicting vars)
    try { require('dotenv').config({ override: true }); } catch (e) { }
}

const connectionString = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;
if (!connectionString) {
    console.error('[db] connection string is still missing after checks.');
} else {
    console.log('[db] Connection string found (length: ' + connectionString.length + ')');
    console.log('[db] First 20 chars: ' + connectionString.substring(0, 20));

    if (connectionString.length < 20) {
        console.error('[db] Connection string seems too short! Forcing dotenv load...');
        try { require('dotenv').config(); } catch (e) { console.error(e); }
        // Re-read
        const retry = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;
        console.log('[db] Re-read connection string length: ' + (retry?.length || 0));
        if (retry && retry.length > 20) {
            // Assign to let variable if I can? 
            // connectionString is const. I need to change it to let.
            throw new Error("Please restart the server. Environment variables were not loaded correctly.");
        }
    }
}

const sql = neon(connectionString!);
export const db = drizzle(sql, { schema });
