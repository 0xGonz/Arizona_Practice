import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { db } from "./db";
import { 
  departmentPerformance, 
  doctorPerformance, 
  monthlyFinancialData,
  uploadStatus,
  financialLineItems,
  financialValues,
  financialCategories
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { FinancialDataManager } from "./financial-data-manager";
import Papa from "papaparse";

// Configure multer storage for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

export async function registerRoutes(app: Express): Promise<Server> {
  // CSV Upload API Routes
  app.post("/api/upload/annual", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Validate the file
      if (!req.file.originalname.endsWith('.csv')) {
        return res.status(400).json({ message: "Only CSV files are allowed" });
      }
      
      // Store the uploaded file in memory
      const fileContent = req.file.buffer.toString();
      const filename = req.file.originalname;
      
      console.log(`Processing annual CSV upload: ${filename} (${fileContent.length} bytes)`);
      
      // Verify database connection
      try {
        const tables = await db.execute(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log(`Database connection successful. Found ${tables.rows.length} tables.`);
      } catch (dbError) {
        console.error('Database connection error:', dbError);
      }
      
      // Store the file in the database
      const uploadId = await storage.storeCSVFile('annual', fileContent, filename);
      console.log(`Annual CSV stored with ID: ${uploadId}`);
      
      // Process and store the data in the new structured format
      console.log(`Using FinancialDataManager to store structured annual data for upload ${uploadId}`);
      try {
        const success = await FinancialDataManager.storeStructuredFinancialData(
          uploadId, 
          fileContent, 
          'annual'
        );
        console.log(`Structured annual data storage ${success ? 'successful' : 'failed'}`);
      } catch (structError) {
        console.error('Error storing structured annual financial data:', structError);
        // Continue even if structured storage fails
      }
      
      // Process the CSV data for immediate use
      try {
        // Using the imported Papa from line 19 instead of require
        const parseResult = Papa.parse(fileContent, { 
          header: true, 
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });
        
        console.log(`Parsed annual CSV with ${parseResult.data.length} rows`);
      } catch (parseError) {
        console.error('Error processing annual CSV:', parseError);
        // Continue even if processing fails
      }
      
      res.status(200).json({ 
        message: "Annual CSV file uploaded successfully",
        uploadId
      });
    } catch (error) {
      console.error("Error uploading annual CSV:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/upload/monthly/:type", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { type } = req.params;
      const { month } = req.query;
      
      // Validate parameters
      if (type !== 'e' && type !== 'o') {
        return res.status(400).json({ message: "Invalid file type (must be 'e' or 'o')" });
      }
      
      if (!month || typeof month !== 'string') {
        return res.status(400).json({ message: "Month parameter is required" });
      }
      
      // Validate the file
      if (!req.file.originalname.endsWith('.csv')) {
        return res.status(400).json({ message: "Only CSV files are allowed" });
      }
      
      // Store the uploaded file in memory
      const fileContent = req.file.buffer.toString();
      const filename = req.file.originalname;
      
      console.log(`Processing monthly ${type}-type CSV upload for ${month}: ${filename} (${fileContent.length} bytes)`);
      
      // Store the file in the database
      const csvType = type === 'e' ? 'monthly-e' : 'monthly-o';
      const uploadId = await storage.storeCSVFile(csvType, fileContent, filename, month);
      console.log(`Monthly ${type}-type CSV stored with ID: ${uploadId}`);
      
      // Process and store the data in the new structured format
      console.log(`Using FinancialDataManager to store structured data for upload ${uploadId}`);
      try {
        // First parse the CSV
        const parsedData = await parseCSV(fileContent);
        
        // Validate the parsed data with our Zod schema
        const { validateCSVData } = await import('./validation');
        
        // Check if the parsed data is valid according to our schema
        const validationResult = validateCSVData(parsedData, csvType, month);
        
        if (!validationResult.valid) {
          console.error(`CSV validation failed for upload ${uploadId}:`, validationResult.errors);
          return res.status(422).json({ 
            message: "CSV validation failed", 
            errors: validationResult.errors,
            uploadId: uploadId
          });
        }
        
        console.log(`CSV validation successful for upload ${uploadId}, proceeding with ${validationResult.validatedData.length} valid rows`);
        
        // Continue with storing the validated data
        const success = await FinancialDataManager.storeStructuredFinancialData(
          uploadId, 
          fileContent, 
          csvType, 
          month
        );
        console.log(`Structured data storage ${success ? 'successful' : 'failed'}`);
      } catch (structError) {
        console.error('Error storing structured financial data:', structError);
        // Continue even if structured storage fails
      }
      
      // Process the CSV data right away
      try {
        const parseResult = Papa.parse(fileContent, { 
          header: true, 
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });
        
        console.log(`Parsed ${month} ${type}-type CSV with ${parseResult.data.length} rows`);
        
        if (csvType === 'monthly-o') {
          // Process department data for O-type files
          try {
            const { extractDepartmentPerformanceData } = require('../client/src/lib/department-utils-new');
            
            const mockMonthlyData = {
              [month]: {
                o: {
                  lineItems: parseResult.data,
                  entityColumns: Object.keys(parseResult.data[0] || {})
                    .filter(key => key !== 'Line Item' && key.trim() !== '')
                }
              }
            };
            
            const departmentData = extractDepartmentPerformanceData(mockMonthlyData);
            console.log(`Extracted ${departmentData.length} departments from ${month} data`);
            
            if (departmentData.length > 0) {
              const success = await storage.storeDepartmentData(departmentData, month, uploadId);
              console.log(`Department data storage ${success ? 'successful' : 'failed'}`);
            }
          } catch (deptError) {
            console.error(`Error processing department data for ${month}:`, deptError);
          }
        } else if (csvType === 'monthly-e') {
          // Process doctor data for E-type files
          try {
            const { extractDoctorPerformanceData } = require('../client/src/lib/performance-utils');
            
            const mockMonthlyData = {
              [month]: {
                e: {
                  lineItems: parseResult.data,
                  entityColumns: Object.keys(parseResult.data[0] || {})
                    .filter(key => key !== 'Line Item' && key.trim() !== '')
                }
              }
            };
            
            const doctorData = extractDoctorPerformanceData(mockMonthlyData);
            console.log(`Extracted ${doctorData.length} doctors from ${month} data`);
            
            if (doctorData.length > 0) {
              const success = await storage.storeDoctorData(doctorData, month, uploadId);
              console.log(`Doctor data storage ${success ? 'successful' : 'failed'}`);
            }
          } catch (doctorError) {
            console.error(`Error processing doctor data for ${month}:`, doctorError);
          }
        }
        
        // Store monthly financial data for both types
        try {
          // Calculate basic financial metrics
          let totalRevenue = 0;
          let totalExpenses = 0;
          
          // Look for revenue and expense items
          for (const row of parseResult.data) {
            const lineItem = row['Line Item'] || '';
            
            if (lineItem.toLowerCase().includes('revenue') || 
                lineItem.toLowerCase().includes('income') ||
                lineItem.toLowerCase().includes('charges')) {
              // Process values from entity columns
              Object.keys(row).forEach(key => {
                if (key !== 'Line Item') {
                  const value = parseFloat(String(row[key]).replace(/[^0-9.-]+/g, ''));
                  if (!isNaN(value)) {
                    totalRevenue += value;
                  }
                }
              });
            }
            
            if (lineItem.toLowerCase().includes('expense') || 
                lineItem.toLowerCase().includes('cost')) {
              // Process values from entity columns
              Object.keys(row).forEach(key => {
                if (key !== 'Line Item') {
                  const value = parseFloat(String(row[key]).replace(/[^0-9.-]+/g, ''));
                  if (!isNaN(value)) {
                    totalExpenses += value;
                  }
                }
              });
            }
          }
          
          const netIncome = totalRevenue - totalExpenses;
          console.log(`Calculated financial metrics for ${month}: Revenue=${totalRevenue}, Expenses=${totalExpenses}, Net=${netIncome}`);
          
          // Store monthly financial data
          const success = await storage.storeMonthlyFinancialData(
            month,
            totalRevenue,
            totalExpenses,
            netIncome,
            [], // Revenue mix - simplified for now
            [], // Margin trend - simplified for now
            uploadId
          );
          
          console.log(`Monthly financial data storage ${success ? 'successful' : 'failed'}`);
        } catch (finError) {
          console.error(`Error storing monthly financial data for ${month}:`, finError);
        }
      } catch (parseError) {
        console.error(`Error parsing ${month} ${type}-type CSV:`, parseError);
      }
      
      res.status(200).json({ 
        message: `Monthly ${type.toUpperCase()} CSV file for ${month} uploaded successfully`,
        uploadId
      });
    } catch (error) {
      console.error("Error uploading monthly CSV:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get upload history
  app.get("/api/uploads", async (req, res) => {
    try {
      const uploads = await storage.getCSVUploads();
      res.status(200).json(uploads);
    } catch (error) {
      console.error("Error retrieving upload history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get CSV file by ID
  app.get("/api/uploads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const upload = await storage.getCSVUploadById(Number(id));
      
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      res.status(200).json(upload);
    } catch (error) {
      console.error("Error retrieving upload:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Mark an upload as processed
  app.post("/api/uploads/:id/mark-processed", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid upload ID" });
      }
      
      // Get the existing upload to verify it exists
      const upload = await storage.getCSVUploadById(id);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      // Update the processed flag in the database
      try {
        const result = await db.execute(
          `UPDATE csv_uploads SET processed = true WHERE id = $1`,
          [id]
        );
        console.log(`Marked upload ID ${id} as processed`);
        res.status(200).json({ success: true });
      } catch (dbError) {
        console.error(`Database error marking upload ${id} as processed:`, dbError);
        res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Error marking upload as processed:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Clear all uploads
  app.delete("/api/uploads/clear-all", async (req, res) => {
    // Use a client with transaction for proper foreign key handling
    const client = await pool.connect();
    
    try {
      // Start a transaction to ensure either all operations succeed or all fail
      await client.query('BEGIN');
      
      // Delete from the dependent tables first, in order of their dependencies
      await client.query('DELETE FROM monthly_financial_data');
      await client.query('DELETE FROM department_performance');
      await client.query('DELETE FROM doctor_performance');
      await client.query('DELETE FROM upload_status');
      
      // Then delete the parent records
      await client.query('DELETE FROM csv_uploads');
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log("All database data has been cleared successfully");
      res.status(200).json({ success: true, message: "All data cleared" });
    } catch (error) {
      // If any error occurs, roll back the transaction
      await client.query('ROLLBACK');
      console.error("Error clearing all data:", error);
      res.status(500).json({ message: "Error clearing data", error: String(error) });
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  });
  
  // Clear specific uploads
  app.delete("/api/uploads/clear", async (req, res) => {
    try {
      const { type, month } = req.query;
      
      if (!type) {
        return res.status(400).json({ message: "Type is required" });
      }
      
      let query = `DELETE FROM csv_uploads WHERE type = $1`;
      let params = [type];
      
      if (month) {
        query += ` AND month = $2`;
        params.push(month as string);
      }
      
      // Delete the uploads
      await db.execute(query, params);
      
      // Also delete related data
      if (type === 'annual') {
        // Clear annual data
        await db.execute(`DELETE FROM csv_data WHERE upload_id IN (SELECT id FROM csv_uploads WHERE type = 'annual')`);
      } else if (type === 'monthly-e' && month) {
        // Clear monthly E data for this month
        await db.execute(
          `DELETE FROM csv_data WHERE upload_id IN (SELECT id FROM csv_uploads WHERE type = 'monthly-e' AND month = $1)`,
          [month]
        );
        
        await db.execute(
          `DELETE FROM doctor_performance WHERE month = $1`,
          [month]
        );
      } else if (type === 'monthly-o' && month) {
        // Clear monthly O data for this month
        await db.execute(
          `DELETE FROM csv_data WHERE upload_id IN (SELECT id FROM csv_uploads WHERE type = 'monthly-o' AND month = $1)`,
          [month]
        );
        
        await db.execute(
          `DELETE FROM department_performance WHERE month = $1`,
          [month]
        );
      }
      
      // Clear monthly financial data if both E and O data for a month are deleted
      if (month && (type === 'monthly-e' || type === 'monthly-o')) {
        const remainingCount = await db.execute(
          `SELECT COUNT(*) FROM csv_uploads WHERE month = $1 AND (type = 'monthly-e' OR type = 'monthly-o')`,
          [month]
        );
        
        if (remainingCount.rows[0].count === '0') {
          await db.execute(
            `DELETE FROM monthly_financial_data WHERE month = $1`,
            [month]
          );
        }
      }
      
      console.log(`Cleared ${type} data${month ? ` for ${month}` : ''}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error clearing data:", error);
      res.status(500).json({ message: "Database error" });
    }
  });
  
  // New advanced financial data query endpoint
  app.get("/api/finance/query", async (req, res) => {
    try {
      const { 
        month, 
        year, 
        category, 
        lineItemPattern, 
        entityNames, 
        minDepth, 
        maxDepth,
        fileType,
        limit = "100"
      } = req.query;
      
      console.log("Financial data query:", req.query);
      
      // Validate and convert parameters
      const queryParams: any = {};
      
      if (month && typeof month === 'string') {
        queryParams.month = month;
      }
      
      if (year && typeof year === 'string') {
        queryParams.year = parseInt(year);
      }
      
      if (category && typeof category === 'string') {
        queryParams.category = category;
      }
      
      if (lineItemPattern && typeof lineItemPattern === 'string') {
        queryParams.lineItemPattern = lineItemPattern;
      }
      
      if (entityNames && typeof entityNames === 'string') {
        queryParams.entityNames = entityNames.split(',');
      }
      
      if (minDepth && typeof minDepth === 'string') {
        queryParams.minDepth = parseInt(minDepth);
      }
      
      if (maxDepth && typeof maxDepth === 'string') {
        queryParams.maxDepth = parseInt(maxDepth);
      }
      
      if (fileType && (fileType === 'annual' || fileType === 'monthly-e' || fileType === 'monthly-o')) {
        queryParams.fileType = fileType as CSVFileType;
      }
      
      if (limit && typeof limit === 'string') {
        queryParams.limit = parseInt(limit);
      }
      
      // Query the financial data
      const results = await FinancialDataManager.queryFinancialData(queryParams);
      
      res.status(200).json({
        query: queryParams,
        count: results.length,
        results
      });
    } catch (error) {
      console.error("Error querying financial data:", error);
      res.status(500).json({ 
        message: "Error querying financial data", 
        error: String(error)
      });
    }
  });
  
  // Delete financial data endpoint
  app.delete("/api/finance/delete", async (req, res) => {
    try {
      const { 
        uploadId,
        lineItemIds,
        month, 
        year, 
        category,
        fileType,
        deleteAll = false
      } = req.body;
      
      console.log("Delete financial data request:", req.body);
      
      if (!uploadId && !lineItemIds && !month && !year && !category && !fileType && !deleteAll) {
        return res.status(400).json({ 
          message: "Delete requires at least one filter parameter or deleteAll=true" 
        });
      }
      
      // For safety, require confirmation for delete all operations
      if (deleteAll && req.body.confirmDeleteAll !== "CONFIRM_DELETE_ALL") {
        return res.status(400).json({ 
          message: "Delete all operations require explicit confirmation" 
        });
      }
      
      // Handle deleting by parameters
      let deletedCount = 0;
      
      if (uploadId) {
        // Delete specific upload and related data
        const result = await FinancialDataManager.deleteFinancialData({ uploadId: Number(uploadId) });
        deletedCount = result.count;
      } else if (lineItemIds && Array.isArray(lineItemIds)) {
        // Delete specific line items
        const result = await FinancialDataManager.deleteFinancialData({ lineItemIds });
        deletedCount = result.count;
      } else {
        // Delete by filters
        const deleteParams: any = {};
        
        if (month) deleteParams.month = month;
        if (year) deleteParams.year = parseInt(year);
        if (category) deleteParams.category = category;
        if (fileType) deleteParams.fileType = fileType;
        if (deleteAll) deleteParams.deleteAll = true;
        
        const result = await FinancialDataManager.deleteFinancialData(deleteParams);
        deletedCount = result.count;
      }
      
      res.status(200).json({
        message: `Successfully deleted ${deletedCount} financial data entries`,
        deletedCount
      });
    } catch (error) {
      console.error("Error deleting financial data:", error);
      res.status(500).json({ 
        message: "Error deleting financial data", 
        error: String(error)
      });
    }
  });
  
  // API route to get department data
  app.get("/api/departments/:month", async (req, res) => {
    try {
      const { month } = req.params;
      console.log(`API request for department data - month: ${month}`);
      
      // First try to get data from the database
      const departments = await db.select().from(departmentPerformance)
        .where(eq(departmentPerformance.month, month))
        .orderBy(desc(departmentPerformance.revenue));
      
      console.log(`Database query for ${month} returned ${departments.length} departments`);
      
      if (departments && departments.length > 0) {
        // We found data in the database, return it
        console.log(`Returning ${departments.length} departments from database for ${month}`);
        return res.status(200).json({ 
          source: 'database',
          departments 
        });
      }
      
      // If no data in database, extract from CSV files
      console.log(`No department data in database for ${month}, checking CSV files...`);
      const upload = await storage.getMostRecentUploadByType('monthly-o', month);
      
      if (!upload) {
        console.log(`No monthly O-type CSV found for ${month}`);
        return res.status(404).json({ 
          message: `No monthly CSV data found for ${month}`,
          departments: [] 
        });
      }
      
      console.log(`Found CSV upload (ID: ${upload.id}) for ${month}, parsing content...`);
      
      // Parse CSV content if available
      if (upload.content) {
        try {
          // We'll use the same extraction logic as in client code
          const Papa = require('papaparse');
          const parseResult = Papa.parse(upload.content, { 
            header: true, 
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
          });
          
          console.log(`CSV parsed with ${parseResult.data.length} rows`);
          
          if (parseResult.errors && parseResult.errors.length > 0) {
            console.warn('CSV parse warnings:', parseResult.errors);
          }
          
          // Import the department extraction function from the client library
          const { extractDepartmentPerformanceData } = require('../client/src/lib/department-utils-new');
          
          // Simulate the data store structure expected by the function
          const mockMonthlyData = {
            [month]: {
              o: {
                lineItems: parseResult.data,
                entityColumns: Object.keys(parseResult.data[0] || {})
                  .filter(key => key !== 'Line Item' && key.trim() !== '')
              }
            }
          };
          
          console.log(`Processing department data with entity columns:`, 
            mockMonthlyData[month].o.entityColumns);
          
          // Extract department data
          const departmentData = extractDepartmentPerformanceData(mockMonthlyData);
          console.log(`Extracted ${departmentData.length} departments from CSV data`);
          
          // Store the data for future use
          if (departmentData.length > 0) {
            console.log(`Storing ${departmentData.length} departments in database...`);
            const success = await storage.storeDepartmentData(departmentData, month, upload.id);
            console.log(`Database storage ${success ? 'successful' : 'failed'}`);
            
            // Double-check data was stored correctly
            const storedDepts = await db.select().from(departmentPerformance)
              .where(eq(departmentPerformance.month, month));
            console.log(`Verified ${storedDepts.length} departments in database after storage`);
          }
          
          return res.status(200).json({ 
            source: 'csv',
            departments: departmentData
          });
        } catch (parseError) {
          console.error(`Error processing CSV for ${month}:`, parseError);
          return res.status(500).json({ 
            message: `Error processing CSV data for ${month}`,
            error: parseError.message,
            departments: [] 
          });
        }
      }
      
      return res.status(404).json({ 
        message: `No department data found for ${month}`,
        departments: [] 
      });
    } catch (error) {
      console.error(`Error fetching department data for ${req.params.month}:`, error);
      res.status(500).json({ 
        message: "Error retrieving department data", 
        error: String(error),
        departments: []
      });
    }
  });
  
  // API route to get doctor performance data
  app.get("/api/doctors/:month", async (req, res) => {
    try {
      const { month } = req.params;
      
      // Get doctor data from the database
      const doctors = await db.select().from(doctorPerformance)
        .where(eq(doctorPerformance.month, month))
        .orderBy(desc(doctorPerformance.revenue));
      
      if (!doctors || doctors.length === 0) {
        // If no data in database, extract from CSV files
        const upload = await storage.getMostRecentUploadByType('monthly-e', month);
        
        if (!upload) {
          return res.status(404).json({ 
            message: `No monthly CSV data found for ${month}`,
            doctors: [] 
          });
        }
        
        // Parse CSV content if available
        if (upload.content) {
          // We'll use the same extraction logic as in client code
          const Papa = require('papaparse');
          const parseResult = Papa.parse(upload.content, { header: true, skipEmptyLines: true });
          
          // Import the doctor extraction function from the client library
          const { extractDoctorPerformanceData } = require('../client/src/lib/performance-utils');
          
          // Simulate the data store structure expected by the function
          const mockMonthlyData = {
            [month]: {
              e: {
                lineItems: parseResult.data,
                entityColumns: Object.keys(parseResult.data[0] || {}).filter(key => key !== 'Line Item')
              }
            }
          };
          
          // Extract doctor data
          const doctorData = extractDoctorPerformanceData(mockMonthlyData);
          
          // Store the data for future use
          if (doctorData.length > 0) {
            await storage.storeDoctorData(doctorData, month, upload.id);
          }
          
          return res.status(200).json({ 
            source: 'csv',
            doctors: doctorData
          });
        }
        
        return res.status(404).json({ 
          message: `No doctor data found for ${month}`,
          doctors: [] 
        });
      }
      
      // Return doctor data from database
      return res.status(200).json({ 
        source: 'database',
        doctors 
      });
    } catch (error) {
      console.error(`Error fetching doctor data for ${req.params.month}:`, error);
      res.status(500).json({ message: "Error retrieving doctor data", error: error.message });
    }
  });
  
  // API route to get monthly financial data
  app.get("/api/financial/:month", async (req, res) => {
    try {
      const { month } = req.params;
      
      // Get financial data from the database
      const [financialData] = await db.select().from(monthlyFinancialData)
        .where(eq(monthlyFinancialData.month, month))
        .orderBy(desc(monthlyFinancialData.createdAt))
        .limit(1);
      
      if (!financialData) {
        return res.status(404).json({ 
          message: `No financial data found for ${month}`,
          data: null
        });
      }
      
      // Parse JSON fields if needed
      const result = {
        ...financialData,
        revenueMix: financialData.revenueMix ? JSON.parse(financialData.revenueMix.toString()) : null,
        marginTrend: financialData.marginTrend ? JSON.parse(financialData.marginTrend.toString()) : null
      };
      
      // Return financial data
      return res.status(200).json({ 
        source: 'database',
        data: result
      });
    } catch (error) {
      console.error(`Error fetching financial data for ${req.params.month}:`, error);
      res.status(500).json({ message: "Error retrieving financial data", error: error.message });
    }
  });
  
  // API route to get upload status
  app.get("/api/status", async (req, res) => {
    try {
      // Get upload status from the database
      const status = await db.select().from(uploadStatus)
        .orderBy(desc(uploadStatus.updatedAt));
      
      if (!status || status.length === 0) {
        return res.status(200).json({ 
          message: "No upload status found",
          status: {}
        });
      }
      
      // Convert to the format expected by the client
      const formattedStatus = {
        annual: status.some(s => s.annualUploaded),
        monthly: status.reduce((acc, s) => {
          acc[s.month] = {
            e: s.monthlyEUploaded || false,
            o: s.monthlyOUploaded || false
          };
          return acc;
        }, {})
      };
      
      // Return status data
      return res.status(200).json({ 
        status: formattedStatus
      });
    } catch (error) {
      console.error("Error fetching upload status:", error);
      res.status(500).json({ message: "Error retrieving upload status", error: error.message });
    }
  });

  // Get a specific CSV upload by ID
  app.get("/api/uploads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid upload ID" });
      }
      
      const upload = await storage.getCSVUploadById(id);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      res.json(upload);
    } catch (error) {
      console.error(`Error fetching CSV upload ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching CSV upload" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
