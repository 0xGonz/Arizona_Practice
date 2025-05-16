import { 
  csvUploads,
  type CSVUpload,
  type InsertCSVUpload,
  type CSVFileType
} from "@shared/schema";

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

export const storage = new MemStorage();
