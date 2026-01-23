import * as dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "../backend/db/schema";
import * as schema from "../backend/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// Use pg driver directly for seed script (works both locally and in CI/CD)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

const SALT_ROUNDS = 10;

async function seedAdmin() {
    const adminUsername = "admin";
    const adminPassword = "Admin123!";

    console.log("Checking if admin user exists...");

    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
        where: eq(users.username, adminUsername),
    });

    if (existingAdmin) {
        console.log("Admin user already exists. Skipping seed.");
        await pool.end();
        process.exit(0);
    }

    console.log("Creating admin user...");

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    // Create admin user
    const [admin] = await db.insert(users).values({
        username: adminUsername,
        password: hashedPassword,
    }).returning();

    console.log("Admin user created successfully!");
    console.log("Username:", adminUsername);
    console.log("Password:", adminPassword);
    console.log("User ID:", admin.id);

    await pool.end();
    process.exit(0);
}

seedAdmin().catch(async (error) => {
    console.error("Error seeding admin user:", error);
    await pool.end();
    process.exit(1);
});
