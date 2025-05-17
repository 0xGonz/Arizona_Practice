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
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS monthly_financial_data (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        total_revenue NUMERIC NOT NULL,
        total_expenses NUMERIC NOT NULL,
        net_income NUMERIC NOT NULL,
        revenue_mix JSONB,
        margin_trend JSONB,
        upload_id INTEGER REFERENCES csv_uploads(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS department_performance (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        revenue NUMERIC NOT NULL,
        expenses NUMERIC NOT NULL,
        net_income NUMERIC NOT NULL,
        profit_margin NUMERIC,
        upload_id INTEGER REFERENCES csv_uploads(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS doctor_performance (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        revenue NUMERIC NOT NULL,
        expenses NUMERIC NOT NULL,
        net_income NUMERIC NOT NULL,
        percentage_of_total NUMERIC,
        upload_id INTEGER REFERENCES csv_uploads(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS upload_status (
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        annual_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
        monthly_e_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
        monthly_o_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (month, year)
      );
    `);
    
    // Add any missing columns to existing tables
    try {
      await db.execute(`ALTER TABLE csv_uploads ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;`);
    } catch (e) {
      console.log("Column 'processed' might already exist in csv_uploads table:", e);
    }
    
    console.log("Database schema setup complete");
  } catch (error) {
    console.error("Error setting up database schema:", error);
  }
}