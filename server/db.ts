import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon database connection
neonConfig.webSocketConstructor = ws;

// Create a singleton database connection pool to prevent connection issues
let dbPool: Pool | null = null;

// Get database pool with connection limits
function getPool() {
  if (!dbPool) {
    console.log("Creating new database connection pool");
    dbPool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 3, // Strict limit to prevent "too many connections" errors
      idleTimeoutMillis: 10000, // Close idle connections more quickly (10 seconds)
      connectionTimeoutMillis: 3000 // Faster connection timeout (3 seconds)
    });
  }
  return dbPool;
}

// Create database connection
export const db = drizzle(getPool(), { schema });

// Push schema to database
export async function pushSchema() {
  console.log("Pushing database schema...");
  try {
    // Use inline schema for reliability
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
      
      -- Monthly financial summary data
      CREATE TABLE IF NOT EXISTS monthly_financial_data (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        total_revenue NUMERIC NOT NULL,
        total_expenses NUMERIC NOT NULL,
        net_income NUMERIC NOT NULL,
        revenue_mix JSONB,
        margin_trend JSONB,
        upload_id INTEGER REFERENCES csv_uploads(id) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Department performance metrics
      CREATE TABLE IF NOT EXISTS department_performance (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        department_name TEXT NOT NULL,
        revenue NUMERIC NOT NULL,
        expenses NUMERIC NOT NULL,
        profit NUMERIC NOT NULL,
        margin NUMERIC,
        upload_id INTEGER REFERENCES csv_uploads(id) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Doctor performance metrics
      CREATE TABLE IF NOT EXISTS doctor_performance (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        patient_visits INTEGER,
        revenue NUMERIC NOT NULL,
        cost NUMERIC NOT NULL,
        profit NUMERIC NOT NULL,
        efficiency_score NUMERIC,
        upload_id INTEGER REFERENCES csv_uploads(id) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Upload status tracking
      CREATE TABLE IF NOT EXISTS upload_status (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        monthly_e_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
        monthly_o_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
        e_file_upload_id INTEGER REFERENCES csv_uploads(id),
        o_file_upload_id INTEGER REFERENCES csv_uploads(id),
        last_updated TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log("Database schema setup complete");
  } catch (error) {
    console.error("Error setting up database schema:", error);
  }
}