import fs from 'fs/promises';
import path from 'path';
import { CSVFileType } from '@shared/schema';

// Directory to store uploaded files
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Save an uploaded CSV file to disk
export async function saveCSV(type: CSVFileType, content: string, filename: string, month?: string): Promise<string> {
  await ensureDataDir();
  
  // Create a filename that includes the type and month (if applicable)
  const saveFilename = month ? `${type}-${month}.csv` : `${type}.csv`;
  const filePath = path.join(DATA_DIR, saveFilename);
  
  try {
    // Write the file content
    await fs.writeFile(filePath, content, 'utf8');
    
    // Write metadata file
    const metadata = {
      originalFilename: filename,
      type,
      month,
      uploadedAt: new Date().toISOString()
    };
    await fs.writeFile(
      `${filePath}.meta.json`, 
      JSON.stringify(metadata, null, 2), 
      'utf8'
    );
    
    console.log(`Saved ${type} CSV file to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Error saving ${type} CSV file:`, error);
    throw error;
  }
}

// Load a CSV file from disk
export async function loadCSV(type: CSVFileType, month?: string): Promise<{ content: string, metadata: any } | null> {
  await ensureDataDir();
  
  // Determine the filename
  const filename = month ? `${type}-${month}.csv` : `${type}.csv`;
  const filePath = path.join(DATA_DIR, filename);
  const metaPath = `${filePath}.meta.json`;
  
  try {
    // Check if file exists
    await fs.access(filePath);
    await fs.access(metaPath);
    
    // Read file content and metadata
    const content = await fs.readFile(filePath, 'utf8');
    const metadataRaw = await fs.readFile(metaPath, 'utf8');
    const metadata = JSON.parse(metadataRaw);
    
    return { content, metadata };
  } catch (error) {
    // File doesn't exist or other error
    return null;
  }
}

// List all available CSV files
export async function listCSVFiles(): Promise<Array<{ type: CSVFileType, month?: string, metadata: any }>> {
  await ensureDataDir();
  
  try {
    const files = await fs.readdir(DATA_DIR);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    const result = [];
    for (const file of csvFiles) {
      const metaPath = path.join(DATA_DIR, `${file}.meta.json`);
      try {
        const metadataRaw = await fs.readFile(metaPath, 'utf8');
        const metadata = JSON.parse(metadataRaw);
        result.push({
          type: metadata.type as CSVFileType,
          month: metadata.month,
          metadata
        });
      } catch (err) {
        // Skip files without metadata
        console.error(`Error reading metadata for ${file}:`, err);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error listing CSV files:', error);
    return [];
  }
}

// Initialize the storage system
export async function initStorage() {
  await ensureDataDir();
  console.log('File storage system initialized');
}