// This script will properly delete all database records using proper sequencing
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearAllData() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');

    // First delete from dependent tables in the right order
    await client.query('DELETE FROM monthly_financial_data');
    await client.query('DELETE FROM department_performance');
    await client.query('DELETE FROM doctor_performance');
    await client.query('DELETE FROM upload_status');
    
    // Finally delete from the main table
    await client.query('DELETE FROM csv_uploads');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('All database data cleared successfully.');
  } catch (e) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error clearing data:', e);
  } finally {
    client.release();
  }
}

clearAllData();
