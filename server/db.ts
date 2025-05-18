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
      -- Main table for storing CSV file uploads
      CREATE TABLE IF NOT EXISTS csv_uploads (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        filename TEXT NOT NULL,
        content TEXT NOT NULL,
        month TEXT,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed BOOLEAN NOT NULL DEFAULT FALSE
      );
      
      -- Table for structured CSV data with proper line items and columns
      CREATE TABLE IF NOT EXISTS csv_data (
        id SERIAL PRIMARY KEY,
        upload_id INTEGER REFERENCES csv_uploads(id) NOT NULL,
        row_index INTEGER NOT NULL,
        row_type TEXT NOT NULL,
        depth INTEGER NOT NULL DEFAULT 0,
        line_item TEXT NOT NULL,
        values JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Table for financial categories (revenue, expenses, etc.)
      CREATE TABLE IF NOT EXISTS financial_categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        parent_id INTEGER REFERENCES financial_categories(id),
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Table for financial line items with proper hierarchy
      CREATE TABLE IF NOT EXISTS financial_line_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        depth INTEGER NOT NULL DEFAULT 0,
        category_id INTEGER REFERENCES financial_categories(id),
        parent_id INTEGER REFERENCES financial_line_items(id),
        upload_id INTEGER REFERENCES csv_uploads(id) NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_total BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Table for financial values (actual numeric data)
      CREATE TABLE IF NOT EXISTS financial_values (
        id SERIAL PRIMARY KEY,
        line_item_id INTEGER REFERENCES financial_line_items(id) NOT NULL,
        column_name TEXT NOT NULL,
        column_index INTEGER NOT NULL,
        value NUMERIC,
        is_calculated BOOLEAN NOT NULL DEFAULT FALSE,
        upload_id INTEGER REFERENCES csv_uploads(id) NOT NULL,
        month TEXT,
        year INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
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