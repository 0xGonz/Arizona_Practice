import { 
  csvUploads,
  uploadStatus,
  departmentPerformance,
  doctorPerformance,
  monthlyFinancialData,
  csvData,
  type CSVUpload,
  type InsertCSVUpload,
  type CSVFileType,
  type CSVRowType
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import Papa from 'papaparse';

export interface IStorage {
  storeCSVFile(
    type: CSVFileType,
    content: string,
    filename: string,
    month?: string
  ): Promise<number>;
  
  storeStructuredCSVData(
    uploadId: number,
    content: string,
    type: CSVFileType
  ): Promise<boolean>;
  
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
  
  async storeStructuredCSVData(
    uploadId: number,
    content: string,
    type: CSVFileType
  ): Promise<boolean> {
    // MemStorage doesn't persist structured CSV data
    return true;
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
  async storeStructuredCSVData(
    uploadId: number,
    content: string,
    type: CSVFileType
  ): Promise<boolean> {
    try {
      // First, parse the CSV content using PapaParser
      const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: true
      });
      
      if (!parseResult.data || parseResult.data.length === 0) {
        console.error('No data found in CSV content');
        return false;
      }
      
      // Get headers (first row) and extract line item column name
      const headers = parseResult.meta.fields || [];
      const lineItemColumnName = headers[0] || 'Line Item';
      
      // Delete any existing structured data for this upload
      await db.delete(csvData).where(eq(csvData.uploadId, uploadId));
      
      // Process each row
      const rows = parseResult.data as Array<Record<string, string>>;
      let rowIndex = 0;
      let currentDepth = 0;
      
      for (const row of rows) {
        const lineItem = row[lineItemColumnName] || '';
        
        // Skip empty rows
        if (!lineItem.trim()) {
          rowIndex++;
          continue;
        }
        
        // Calculate depth by counting leading spaces (2 spaces = 1 depth level)
        const leadingSpaces = lineItem.match(/^(\s*)/)?.[1].length || 0;
        currentDepth = Math.floor(leadingSpaces / 2);
        
        // Determine row type (header, data, total)
        let rowType: CSVRowType = 'data';
        if (lineItem.toLowerCase().includes('total')) {
          rowType = 'total';
        } else if (currentDepth === 0) {
          rowType = 'header';
        }
        
        // Extract values for this row (excluding the line item column)
        const values: Record<string, string> = {};
        for (const header of headers) {
          if (header !== lineItemColumnName) {
            values[header] = row[header] || '';
          }
        }
        
        // Store the structured row data
        await db.insert(csvData).values({
          uploadId,
          rowIndex,
          rowType,
          depth: currentDepth,
          lineItem: lineItem.trim(),
          values: JSON.stringify(values)
        });
        
        rowIndex++;
      }
      
      // Update the processed flag on the original upload
      await db.update(csvUploads)
        .set({ processed: true })
        .where(eq(csvUploads.id, uploadId));
      
      console.log(`Successfully stored structured CSV data for upload ${uploadId} (${rowIndex} rows)`);
      return true;
    } catch (error) {
      console.error('Error storing structured CSV data:', error);
      return false;
    }
  }
  
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
                  monthlyEUploaded: true,
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
                  monthlyOUploaded: true,
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
              annualUploaded: false,
              monthlyEUploaded: type === 'monthly-e',
              monthlyOUploaded: type === 'monthly-o',
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
      } else if (type === 'annual') {
        // For annual CSV files
        try {
          // Update all status records for the current year to indicate annual file was uploaded
          await db.update(uploadStatus)
            .set({ 
              annualUploaded: true,
              lastUpdated: new Date()
            })
            .where(eq(uploadStatus.year, currentYear));
        } catch (error) {
          console.error('Error updating annual upload status:', error);
        }
      }
      
      // Store the data in a more structured format
      try {
        await this.storeStructuredCSVData(uploadId, content, type);
      } catch (error) {
        console.error('Error storing structured CSV data:', error);
        // Continue anyway - we still have the raw data
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