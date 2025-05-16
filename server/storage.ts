import { 
  csvUploads,
  type CSVUpload,
  type InsertCSVUpload,
  type CSVFileType
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  storeCSVFile(
    type: CSVFileType,
    content: string,
    filename: string,
    month?: string
  ): Promise<number>;
  
  getCSVUploads(): Promise<CSVUpload[]>;
  getCSVUploadById(id: number): Promise<CSVUpload | undefined>;
}

export class MemStorage implements IStorage {
  private uploads: Map<number, CSVUpload>;
  currentId: number;

  constructor() {
    this.uploads = new Map();
    this.currentId = 1;
  }

  async storeCSVFile(
    type: CSVFileType,
    content: string,
    filename: string,
    month?: string
  ): Promise<number> {
    const id = this.currentId++;
    const timestamp = new Date();
    
    const upload: CSVUpload = {
      id,
      type,
      filename,
      content,
      month,
      uploadedAt: timestamp
    };
    
    this.uploads.set(id, upload);
    return id;
  }

  async getCSVUploads(): Promise<CSVUpload[]> {
    return Array.from(this.uploads.values()).map(upload => ({
      ...upload,
      // Don't return the content in the list view to reduce payload size
      content: ''
    }));
  }

  async getCSVUploadById(id: number): Promise<CSVUpload | undefined> {
    return this.uploads.get(id);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async storeCSVFile(
    type: CSVFileType,
    content: string,
    filename: string,
    month?: string
  ): Promise<number> {
    try {
      // Store in database
      const [upload] = await db.insert(csvUploads).values({
        type,
        filename,
        content,
        month
      }).returning();
      
      return upload.id;
    } catch (error) {
      console.error('Error storing CSV file in database:', error);
      throw error;
    }
  }

  async getCSVUploads(): Promise<CSVUpload[]> {
    try {
      // Get all uploads but exclude content to reduce payload size
      const uploads = await db.select({
        id: csvUploads.id,
        type: csvUploads.type,
        filename: csvUploads.filename,
        month: csvUploads.month,
        uploadedAt: csvUploads.uploadedAt,
        // Return empty content
        content: sql`''`
      }).from(csvUploads);
      
      return uploads;
    } catch (error) {
      console.error('Error fetching CSV uploads from database:', error);
      return [];
    }
  }

  async getCSVUploadById(id: number): Promise<CSVUpload | undefined> {
    try {
      const [upload] = await db.select().from(csvUploads).where(eq(csvUploads.id, id));
      return upload;
    } catch (error) {
      console.error(`Error fetching CSV upload ${id} from database:`, error);
      return undefined;
    }
  }

  // New method to retrieve the most recent upload of a specific type
  async getMostRecentUploadByType(type: CSVFileType, month?: string): Promise<CSVUpload | undefined> {
    try {
      let query = db.select()
        .from(csvUploads)
        .where(eq(csvUploads.type, type))
        .orderBy(desc(csvUploads.uploadedAt))
        .limit(1);
      
      if (month && (type === 'monthly-e' || type === 'monthly-o')) {
        query = db.select()
          .from(csvUploads)
          .where(and(
            eq(csvUploads.type, type),
            eq(csvUploads.month, month)
          ))
          .orderBy(desc(csvUploads.uploadedAt))
          .limit(1);
      }
      
      const [upload] = await query;
      return upload;
    } catch (error) {
      console.error(`Error fetching most recent ${type} upload from database:`, error);
      return undefined;
    }
  }
}

// Use memory storage if database is not available, otherwise use database storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
