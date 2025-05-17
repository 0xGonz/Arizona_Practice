import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define types
export type CSVFileType = 'annual' | 'monthly-e' | 'monthly-o';

// Define CSV data types
export type CSVRowType = 'header' | 'data' | 'total';

// Table for storing structured CSV data
export const csvData = pgTable("csv_data", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id").references(() => csvUploads.id).notNull(),
  rowIndex: integer("row_index").notNull(), // Position of row in the original CSV
  rowType: text("row_type").notNull(), // 'header', 'data', 'total'
  depth: integer("depth").default(0).notNull(), // Indentation level (0 for top level)
  lineItem: text("line_item").notNull(), // Description or line item name
  values: jsonb("values").notNull(), // Column values as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table for storing uploaded CSV files
export const csvUploads = pgTable("csv_uploads", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  month: text("month"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processed: boolean("processed").default(false).notNull(),
});

// Table for storing processed monthly financial data
export const monthlyFinancialData = pgTable("monthly_financial_data", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  totalRevenue: numeric("total_revenue").notNull(),
  totalExpenses: numeric("total_expenses").notNull(),
  netIncome: numeric("net_income").notNull(),
  revenueMix: jsonb("revenue_mix"),  // Store revenue by category
  marginTrend: jsonb("margin_trend"), // Store margin trend data
  uploadId: integer("upload_id").references(() => csvUploads.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table for storing department performance data
export const departmentPerformance = pgTable("department_performance", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  revenue: numeric("revenue").notNull(),
  expenses: numeric("expenses").notNull(),
  netIncome: numeric("net_income").notNull(),
  profitMargin: numeric("profit_margin"),
  uploadId: integer("upload_id").references(() => csvUploads.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table for storing doctor performance data
export const doctorPerformance = pgTable("doctor_performance", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  revenue: numeric("revenue").notNull(),
  expenses: numeric("expenses").notNull(),
  netIncome: numeric("net_income").notNull(),
  percentageOfTotal: numeric("percentage_of_total"),
  uploadId: integer("upload_id").references(() => csvUploads.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial categories for organizing line items
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id").references(() => financialCategories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial line items with proper hierarchy
export const financialLineItems = pgTable("financial_line_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(), // Full path with spaces for hierarchy
  depth: integer("depth").default(0).notNull(),
  parentId: integer("parent_id").references(() => financialLineItems.id),
  categoryId: integer("category_id").references(() => financialCategories.id),
  rowType: text("row_type").notNull(), // 'header', 'data', 'total'
  uploadId: integer("upload_id").references(() => csvUploads.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial values associated with line items
export const financialValues = pgTable("financial_values", {
  id: serial("id").primaryKey(),
  lineItemId: integer("line_item_id").references(() => financialLineItems.id).notNull(),
  entityName: text("entity_name").notNull(), // Employee name, department, or "All Employees"
  originalValue: text("original_value").notNull(), // Raw value from CSV
  numericValue: numeric("numeric_value").notNull(), // Parsed numeric value
  month: text("month"), // Optional month for monthly data
  year: integer("year").notNull().default(new Date().getFullYear()),
  fileType: text("file_type").notNull(), // 'annual', 'monthly-e', 'monthly-o'
  uploadId: integer("upload_id").references(() => csvUploads.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    itemEntityIdx: primaryKey({ columns: [table.lineItemId, table.entityName, table.month, table.year, table.fileType] }),
  }
});

// Table for tracking upload status by month
export const uploadStatus = pgTable("upload_status", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  annualUploaded: boolean("annual_uploaded").default(false).notNull(),
  monthlyEUploaded: boolean("monthly_e_uploaded").default(false).notNull(),
  monthlyOUploaded: boolean("monthly_o_uploaded").default(false).notNull(),
  eFileUploadId: integer("e_file_upload_id").references(() => csvUploads.id),
  oFileUploadId: integer("o_file_upload_id").references(() => csvUploads.id),
  lastUpdated: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    monthYearIdx: primaryKey({ columns: [table.month, table.year] }),
  }
});

// Define insert schemas for each table
export const insertFinancialCategorySchema = createInsertSchema(financialCategories).pick({
  name: true,
  description: true,
  parentId: true,
});

export const insertFinancialLineItemSchema = createInsertSchema(financialLineItems).pick({
  name: true,
  path: true,
  depth: true,
  parentId: true,
  categoryId: true,
  rowType: true,
  uploadId: true,
});

export const insertFinancialValueSchema = createInsertSchema(financialValues).pick({
  lineItemId: true,
  entityName: true,
  originalValue: true,
  numericValue: true, 
  month: true,
  year: true,
  fileType: true,
  uploadId: true,
});

export const insertCSVUploadSchema = createInsertSchema(csvUploads).pick({
  type: true,
  filename: true,
  content: true,
  month: true,
  processed: true,
});

export const insertCSVDataSchema = createInsertSchema(csvData).pick({
  uploadId: true,
  rowIndex: true,
  rowType: true,
  depth: true,
  lineItem: true,
  values: true,
});

export const insertMonthlyFinancialDataSchema = createInsertSchema(monthlyFinancialData).pick({
  month: true,
  year: true,
  totalRevenue: true,
  totalExpenses: true,
  netIncome: true,
  revenueMix: true,
  marginTrend: true,
  uploadId: true,
});

export const insertDepartmentPerformanceSchema = createInsertSchema(departmentPerformance).pick({
  name: true,
  month: true,
  year: true,
  revenue: true,
  expenses: true,
  netIncome: true,
  profitMargin: true,
  uploadId: true,
});

export const insertDoctorPerformanceSchema = createInsertSchema(doctorPerformance).pick({
  name: true,
  month: true,
  year: true,
  revenue: true,
  expenses: true,
  netIncome: true,
  percentageOfTotal: true,
  uploadId: true,
});

export const insertUploadStatusSchema = createInsertSchema(uploadStatus).pick({
  month: true,
  year: true,
  annualUploaded: true,
  monthlyEUploaded: true,
  monthlyOUploaded: true,
});

// Export types for each table
export type InsertFinancialCategory = z.infer<typeof insertFinancialCategorySchema>;
export type FinancialCategory = typeof financialCategories.$inferSelect;

export type InsertFinancialLineItem = z.infer<typeof insertFinancialLineItemSchema>;
export type FinancialLineItem = typeof financialLineItems.$inferSelect;

export type InsertFinancialValue = z.infer<typeof insertFinancialValueSchema>;
export type FinancialValue = typeof financialValues.$inferSelect;

export type InsertCSVUpload = z.infer<typeof insertCSVUploadSchema>;
export type CSVUpload = typeof csvUploads.$inferSelect;

export type InsertMonthlyFinancialData = z.infer<typeof insertMonthlyFinancialDataSchema>;
export type MonthlyFinancialData = typeof monthlyFinancialData.$inferSelect;

export type InsertDepartmentPerformance = z.infer<typeof insertDepartmentPerformanceSchema>;
export type DepartmentPerformance = typeof departmentPerformance.$inferSelect;

export type InsertDoctorPerformance = z.infer<typeof insertDoctorPerformanceSchema>;
export type DoctorPerformance = typeof doctorPerformance.$inferSelect;

export type InsertUploadStatus = z.infer<typeof insertUploadStatusSchema>;
export type UploadStatus = typeof uploadStatus.$inferSelect;
