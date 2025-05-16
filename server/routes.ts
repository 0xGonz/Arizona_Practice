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

  const httpServer = createServer(app);
  return httpServer;
}
