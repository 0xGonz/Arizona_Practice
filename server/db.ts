import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon database connection
neonConfig.webSocketConstructor = ws;

// Create database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Push schema to database
export async function pushSchema() {
  console.log("Pushing database schema...");
  try {
    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS csv_uploads (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        filename TEXT NOT NULL,
        content TEXT NOT NULL,
        month TEXT,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Database schema setup complete");
  } catch (error) {
    console.error("Error setting up database schema:", error);
  }
}