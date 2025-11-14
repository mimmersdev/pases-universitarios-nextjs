import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const isDev = process.env.NODE_ENV === 'development';

let db: NeonHttpDatabase<typeof schema> | NodePgDatabase<typeof schema> & {$client: Pool;};

if (isDev) {
    // Use pg driver for local PostgreSQL
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    db = drizzlePg(pool, { schema });
} else {
    db = drizzle(process.env.DATABASE_URL!, { schema });
}

export { db };