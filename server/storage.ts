import { 
  csvUploads,
  uploadStatus,
  departmentPerformance,
  doctorPerformance,
  monthlyFinancialData,
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
  getMostRecentUploadByType(type: CSVFileType, month?: string): Promise<CSVUpload | undefined>;
  
  // New methods for storing processed data
  storeDepartmentData(departmentData: any[], month: string, uploadId: number): Promise<boolean>;
  storeDoctorData(doctorData: any[], month: string, uploadId: number): Promise<boolean>;
  storeMonthlyFinancialData(
    month: string, 
    totalRevenue: number,
    totalExpenses: number,
    netIncome: number,
    revenueMix: any[],
    marginTrend: any[],
    uploadId: number
  ): Promise<boolean>;
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
      month: month || null,
      uploadedAt: timestamp,
      processed: false
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
  
  async getMostRecentUploadByType(type: CSVFileType, month?: string): Promise<CSVUpload | undefined> {
    const uploads = Array.from(this.uploads.values())
      .filter(upload => upload.type === type && (!month || upload.month === month))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    
    return uploads.length > 0 ? uploads[0] : undefined;
  }
  
  // Stub implementations for in-memory storage
  async storeDepartmentData(_departmentData: any[], _month: string, _uploadId: number): Promise<boolean> {
    // In-memory storage doesn't persist this data between restarts
    console.log('Storing department data (memory only)');
    return true;
  }
  
  async storeDoctorData(_doctorData: any[], _month: string, _uploadId: number): Promise<boolean> {
    // In-memory storage doesn't persist this data between restarts
    console.log('Storing doctor data (memory only)');
    return true;
  }
  
  async storeMonthlyFinancialData(
    _month: string, 
    _totalRevenue: number,
    _totalExpenses: number,
    _netIncome: number,
    _revenueMix: any[],
    _marginTrend: any[],
    uploadId: number
  ): Promise<boolean> {
    // In-memory storage doesn't persist this data between restarts
    console.log('Storing monthly financial data (memory only)');
    
    // Mark the upload as processed
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.processed = true;
      this.uploads.set(uploadId, upload);
    }
    
    return true;
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
      // Get the current year
      const currentYear = new Date().getFullYear();
      
      // Store CSV file in database
      const [upload] = await db.insert(csvUploads).values({
        type,
        filename,
        content,
        month,
        processed: false
      }).returning();
      
      // Update upload status
      if (month) {
        // For monthly CSV files
        try {
          // Check if we already have a record for this month/year
          const [status] = await db.select()
            .from(uploadStatus)
            .where(and(
              eq(uploadStatus.month, month),
              eq(uploadStatus.year, currentYear)
            ));
          
          if (status) {
            // Update existing record
            if (type === 'monthly-e') {
              await db.update(uploadStatus)
                .set({ monthlyEUploaded: true, updatedAt: new Date() })
                .where(and(
                  eq(uploadStatus.month, month),
                  eq(uploadStatus.year, currentYear)
                ));
            } else if (type === 'monthly-o') {
              await db.update(uploadStatus)
                .set({ monthlyOUploaded: true, updatedAt: new Date() })
                .where(and(
                  eq(uploadStatus.month, month),
                  eq(uploadStatus.year, currentYear)
                ));
            }
          } else {
            // Create new record
            const newStatus: any = {
              month,
              year: currentYear,
              annualUploaded: false,
              monthlyEUploaded: type === 'monthly-e',
              monthlyOUploaded: type === 'monthly-o'
            };
            
            await db.insert(uploadStatus).values(newStatus);
          }
        } catch (statusError) {
          console.error('Error updating upload status:', statusError);
          // Continue even if status update fails
        }
      } else if (type === 'annual') {
        // For annual uploads, update all months in the current year
        try {
          const months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          
          for (const monthName of months) {
            // Check if status record exists
            const [existingStatus] = await db.select()
              .from(uploadStatus)
              .where(and(
                eq(uploadStatus.month, monthName),
                eq(uploadStatus.year, currentYear)
              ));
            
            if (existingStatus) {
              // Update existing record
              await db.update(uploadStatus)
                .set({ annualUploaded: true, updatedAt: new Date() })
                .where(and(
                  eq(uploadStatus.month, monthName),
                  eq(uploadStatus.year, currentYear)
                ));
            } else {
              // Create new record
              await db.insert(uploadStatus).values({
                month: monthName,
                year: currentYear,
                annualUploaded: true,
                monthlyEUploaded: false,
                monthlyOUploaded: false
              });
            }
          }
        } catch (statusError) {
          console.error('Error updating annual upload status:', statusError);
          // Continue even if status update fails
        }
      }
      
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
        processed: csvUploads.processed,
        // Return empty content
        content: sql<string>`''`
      }).from(csvUploads)
        .orderBy(desc(csvUploads.uploadedAt));
      
      return uploads as CSVUpload[];
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

  // Store department performance data
  async storeDepartmentData(departmentData: any[], month: string, uploadId: number): Promise<boolean> {
    try {
      const currentYear = new Date().getFullYear();
      
      for (const dept of departmentData) {
        await db.insert(departmentPerformance).values({
          name: dept.name,
          month: month,
          year: currentYear,
          revenue: String(dept.revenue),
          expenses: String(dept.expenses),
          netIncome: String(dept.net || 0),
          profitMargin: String((dept.net / dept.revenue) || 0),
          uploadId: uploadId
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error storing department data:', error);
      return false;
    }
  }

  // Store doctor performance data
  async storeDoctorData(doctorData: any[], month: string, uploadId: number): Promise<boolean> {
    try {
      const currentYear = new Date().getFullYear();
      
      for (const doc of doctorData) {
        await db.insert(doctorPerformance).values({
          name: doc.name,
          month: month,
          year: currentYear,
          revenue: String(doc.revenue),
          expenses: String(doc.expenses),
          netIncome: String(doc.netIncome || 0),
          percentageOfTotal: String(doc.percentage || 0),
          uploadId: uploadId
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error storing doctor data:', error);
      return false;
    }
  }

  // Store monthly financial summary data
  async storeMonthlyFinancialData(
    month: string, 
    totalRevenue: number,
    totalExpenses: number,
    netIncome: number,
    revenueMix: any[],
    marginTrend: any[],
    uploadId: number
  ): Promise<boolean> {
    try {
      const currentYear = new Date().getFullYear();
      
      await db.insert(monthlyFinancialData).values({
        month: month,
        year: currentYear,
        totalRevenue: String(totalRevenue),
        totalExpenses: String(totalExpenses),
        netIncome: String(netIncome),
        revenueMix: revenueMix ? JSON.stringify(revenueMix) : null,
        marginTrend: marginTrend ? JSON.stringify(marginTrend) : null,
        uploadId: uploadId
      });
      
      // Mark the upload as processed
      await db.update(csvUploads)
        .set({ processed: true })
        .where(eq(csvUploads.id, uploadId));
      
      return true;
    } catch (error) {
      console.error('Error storing monthly financial data:', error);
      return false;
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
