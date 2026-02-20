import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://neondb_owner:npg_VjQUeDagK0O9@ep-steep-fire-ae637xly-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function setupDatabase() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sql = fs.readFileSync(path.join(__dirname, 'db_schema.sql'), 'utf8');
        await client.query(sql);

        console.log('Table created successfully');
    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

setupDatabase();
