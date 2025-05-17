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
  private currentId: number;
  
  constructor() {
    this.uploads = new Map<number, CSVUpload>();
    this.currentId = 1;
  }
  
  async storeCSVFile(
    type: CSVFileType,
    content: string,
    filename: string,
    month?: string
  ): Promise<number> {
    const upload: CSVUpload = {
      id: this.currentId,
      type,
      filename,
      content,
      month: month || null,
      uploadedAt: new Date(),
      processed: false
    };
    
    this.uploads.set(this.currentId, upload);
    return this.currentId++;
  }
  
  async getCSVUploads(): Promise<CSVUpload[]> {
    return Array.from(this.uploads.values()).sort((a, b) => b.id - a.id);
  }
  
  async getCSVUploadById(id: number): Promise<CSVUpload | undefined> {
    return this.uploads.get(id);
  }
  
  async getMostRecentUploadByType(type: CSVFileType, month?: string): Promise<CSVUpload | undefined> {
    const uploads = Array.from(this.uploads.values()).filter(upload => {
      if (upload.type !== type) return false;
      if (month && upload.month !== month) return false;
      return true;
    });
    
    return uploads.sort((a, b) => {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    })[0];
  }

  async storeDepartmentData(_departmentData: any[], _month: string, _uploadId: number): Promise<boolean> {
    // Mem storage doesn't persist this data
    return true;
  }
  
  async storeDoctorData(_doctorData: any[], _month: string, _uploadId: number): Promise<boolean> {
    // Mem storage doesn't persist this data
    return true;
  }
  
  async storeMonthlyFinancialData(
    _month: string, 
    _totalRevenue: number,
    _totalExpenses: number,
    _netIncome: number,
    _revenueMix: any[],
    _marginTrend: any[],
    _uploadId: number
  ): Promise<boolean> {
    // Mem storage doesn't persist this data
    return true;
  }
}

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
      
      console.log(`DatabaseStorage: Storing ${type} CSV file in database: ${filename}`);
      
      // Use Drizzle ORM to insert the CSV file
      const [result] = await db.insert(csvUploads).values({
        type: type,
        filename: filename,
        content: content,
        month: month || null,
        uploadedAt: new Date(),
        processed: false
      }).returning();
      
      if (!result) {
        console.error("Failed to insert CSV file: No result returned");
        throw new Error("Database insert failed");
      }
      
      const uploadId = result.id;
      console.log(`DatabaseStorage: CSV upload successful. ID: ${uploadId}`);
      
      // Update upload status
      if (month) {
        // For monthly CSV files
        try {
          // Check if we already have a record for this month/year
          const statusResults = await db.select().from(uploadStatus)
            .where(and(
              eq(uploadStatus.month, month),
              eq(uploadStatus.year, currentYear)
            ));
          
          if (statusResults && statusResults.length > 0) {
            // Update existing record
            if (type === 'monthly-e') {
              await db.update(uploadStatus)
                .set({ 
                  eFile: true,
                  eFileUploadId: uploadId,
                  lastUpdated: new Date()
                })
                .where(and(
                  eq(uploadStatus.month, month),
                  eq(uploadStatus.year, currentYear)
                ));
            } else if (type === 'monthly-o') {
              await db.update(uploadStatus)
                .set({ 
                  oFile: true,
                  oFileUploadId: uploadId,
                  lastUpdated: new Date()
                })
                .where(and(
                  eq(uploadStatus.month, month),
                  eq(uploadStatus.year, currentYear)
                ));
            }
          } else {
            // Create new record
            const newStatus = {
              month,
              year: currentYear,
              eFile: type === 'monthly-e',
              oFile: type === 'monthly-o',
              eFileUploadId: type === 'monthly-e' ? uploadId : null,
              oFileUploadId: type === 'monthly-o' ? uploadId : null,
              lastUpdated: new Date()
            };
            
            await db.insert(uploadStatus).values(newStatus);
          }
        } catch (error) {
          console.error('Error updating upload status:', error);
          // Don't fail the whole operation if status update fails
        }
      }
      
      return uploadId;
    } catch (error) {
      console.error('Error storing CSV file in database:', error);
      throw error;
    }
  }
  
  async getCSVUploads(): Promise<CSVUpload[]> {
    try {
      return await db.select().from(csvUploads).orderBy(desc(csvUploads.uploadedAt));
    } catch (error) {
      console.error('Error fetching CSV uploads:', error);
      return [];
    }
  }
  
  async getCSVUploadById(id: number): Promise<CSVUpload | undefined> {
    try {
      const results = await db.select().from(csvUploads).where(eq(csvUploads.id, id));
      return results[0];
    } catch (error) {
      console.error(`Error fetching CSV upload with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async storeDepartmentData(departmentData: any[], month: string, uploadId: number): Promise<boolean> {
    try {
      console.log(`Storing department data for ${month}, uploadId ${uploadId}`);
      
      // First clear existing data for this month/uploadId
      await db.delete(departmentPerformance)
        .where(and(
          eq(departmentPerformance.month, month),
          eq(departmentPerformance.uploadId, uploadId)
        ));
      
      // Insert new data
      for (const dept of departmentData) {
        await db.insert(departmentPerformance).values({
          name: dept.name,
          month: month,
          revenue: dept.revenue,
          expenses: dept.expenses,
          netIncome: dept.net,
          uploadId: uploadId,
          createdAt: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error storing department data for ${month}:`, error);
      return false;
    }
  }
  
  async storeDoctorData(doctorData: any[], month: string, uploadId: number): Promise<boolean> {
    try {
      console.log(`Storing doctor data for ${month}, uploadId ${uploadId}`);
      
      // First clear existing data for this month/uploadId
      await db.delete(doctorPerformance)
        .where(and(
          eq(doctorPerformance.month, month),
          eq(doctorPerformance.uploadId, uploadId)
        ));
      
      // Insert new data
      for (const doctor of doctorData) {
        await db.insert(doctorPerformance).values({
          name: doctor.name,
          month: month,
          revenue: doctor.revenue,
          expenses: doctor.expenses,
          netIncome: doctor.net,
          uploadId: uploadId,
          createdAt: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error storing doctor data for ${month}:`, error);
      return false;
    }
  }
  
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
      console.log(`Storing monthly financial data for ${month}, uploadId ${uploadId}`);
      
      // First clear existing data for this month/uploadId
      await db.delete(monthlyFinancialData)
        .where(and(
          eq(monthlyFinancialData.month, month),
          eq(monthlyFinancialData.uploadId, uploadId)
        ));
      
      // Insert new data
      await db.insert(monthlyFinancialData).values({
        month: month,
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome: netIncome,
        revenueMix: JSON.stringify(revenueMix),
        marginTrend: JSON.stringify(marginTrend),
        uploadId: uploadId,
        createdAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error(`Error storing monthly financial data for ${month}:`, error);
      return false;
    }
  }
  
  async getMostRecentUploadByType(type: CSVFileType, month?: string): Promise<CSVUpload | undefined> {
    try {
      let query = db.select().from(csvUploads)
        .where(eq(csvUploads.type, type))
        .orderBy(desc(csvUploads.uploadedAt))
        .limit(1);
      
      if (month) {
        query = db.select().from(csvUploads)
          .where(and(
            eq(csvUploads.type, type),
            eq(csvUploads.month, month)
          ))
          .orderBy(desc(csvUploads.uploadedAt))
          .limit(1);
      }
      
      const results = await query;
      return results[0];
    } catch (error) {
      console.error(`Error fetching most recent ${type} upload:`, error);
      return undefined;
    }
  }
}

// Choose storage implementation based on environment
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();