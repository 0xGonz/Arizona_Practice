import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type CSVFileType = 'annual' | 'monthly-e' | 'monthly-o';

export const csvUploads = pgTable("csv_uploads", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  month: text("month"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertCSVUploadSchema = createInsertSchema(csvUploads).pick({
  type: true,
  filename: true,
  content: true,
  month: true,
});

export type InsertCSVUpload = z.infer<typeof insertCSVUploadSchema>;
export type CSVUpload = typeof csvUploads.$inferSelect;
