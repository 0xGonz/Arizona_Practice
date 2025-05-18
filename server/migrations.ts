import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./db";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";

/**
 * Script to run database migrations
 * This applies all pending migrations from the migrations folder
 */
async function runMigrations() {
  console.log("Starting database migration...");
  
  try {
    // Connect to the database
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    // Run migrations from the migrations folder
    console.log("Applying migrations...");
    await migrate(db, { migrationsFolder: "migrations" });
    
    console.log("✅ Database migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();