import * as dotenv from 'dotenv';
import { defineConfig } from "drizzle-kit";
dotenv.config({ override: true });

console.log('Database URL from env:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from .env');
}

console.log('DB URL Start:', process.env.DATABASE_URL?.substring(0, 20) + '...');
try {
    const url = new URL(process.env.DATABASE_URL!);
    console.log('Parsed Host:', url.hostname);
    console.log('Parsed Protocol:', url.protocol);
} catch (e) {
    console.error('Failed to parse URL:', e);
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
