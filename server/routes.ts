import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";

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
      
      // Store the file in the database
      const uploadId = await storage.storeCSVFile('annual', fileContent, filename);
      
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
      
      // Store the file in the database
      const uploadId = await storage.storeCSVFile(
        type === 'e' ? 'monthly-e' : 'monthly-o', 
        fileContent, 
        filename, 
        month
      );
      
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
  
  // API route to get department data
  app.get("/api/departments/:month", async (req, res) => {
    try {
      const { month } = req.params;
      
      // Get department data from the database
      const departments = await db.select().from(departmentPerformance)
        .where(eq(departmentPerformance.month, month))
        .orderBy(desc(departmentPerformance.revenue));
      
      if (!departments || departments.length === 0) {
        // If no data in database, extract from CSV files
        const upload = await storage.getMostRecentUploadByType('monthly-o', month);
        
        if (!upload) {
          return res.status(404).json({ 
            message: `No monthly CSV data found for ${month}`,
            departments: [] 
          });
        }
        
        // Parse CSV content if available
        if (upload.content) {
          // We'll use the same extraction logic as in client code
          const Papa = require('papaparse');
          const parseResult = Papa.parse(upload.content, { header: true, skipEmptyLines: true });
          
          // Import the department extraction function from the client library
          const { extractDepartmentPerformanceData } = require('../client/src/lib/department-utils-new');
          
          // Simulate the data store structure expected by the function
          const mockMonthlyData = {
            [month]: {
              o: {
                lineItems: parseResult.data,
                entityColumns: Object.keys(parseResult.data[0] || {}).filter(key => key !== 'Line Item')
              }
            }
          };
          
          // Extract department data
          const departmentData = extractDepartmentPerformanceData(mockMonthlyData);
          
          // Store the data for future use
          if (departmentData.length > 0) {
            await storage.storeDepartmentData(departmentData, month, upload.id);
          }
          
          return res.status(200).json({ 
            source: 'csv',
            departments: departmentData
          });
        }
        
        return res.status(404).json({ 
          message: `No department data found for ${month}`,
          departments: [] 
        });
      }
      
      // Return department data from database
      return res.status(200).json({ 
        source: 'database',
        departments 
      });
    } catch (error) {
      console.error(`Error fetching department data for ${req.params.month}:`, error);
      res.status(500).json({ message: "Error retrieving department data", error: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
