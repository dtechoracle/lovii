const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL missing');
    process.exit(1);
}

const sql = neon(connectionString);

async function main() {
    console.log('Dropping tables...');
    try {
        await sql('DROP TABLE IF EXISTS notes, tasks, profiles, users, connections, drizzle_migrations CASCADE');
        console.log('Tables dropped.');
    } catch (e) {
        console.error('Error dropping tables:', e);
    }
    process.exit(0);
}

main();
