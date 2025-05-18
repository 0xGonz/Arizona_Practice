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
    // Read schema from file instead of having it inline - more maintainable
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../migrations/schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      console.log("Reading schema from file...");
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // Use a transaction to ensure all tables are created or none
      await db.execute('BEGIN');
      try {
        await db.execute(schemaSQL);
        await db.execute('COMMIT');
        console.log("Database schema applied successfully");
      } catch (err) {
        await db.execute('ROLLBACK');
        throw err;
      }
    } else {
      console.error("Schema file not found at:", schemaPath);
      
      // Fallback to minimal schema if file not found
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
      `);
    }
    
    console.log("Database schema setup complete");
  } catch (error) {
    console.error("Error setting up database schema:", error);
  }
}