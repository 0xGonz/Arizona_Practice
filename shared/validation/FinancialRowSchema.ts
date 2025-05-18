import { z } from "zod";

/**
 * Schema for validating financial row data from CSV files
 * This ensures our data is properly structured before entering the database
 */
export const FinancialRowSchema = z.object({
  // Line item name (e.g., "Total Revenue" or "Payroll Expense")
  lineItem: z.string().min(1),
  
  // Month name (three-letter abbreviation)
  month: z.string().regex(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/),
  
  // Year as four-digit number
  year: z.coerce.number().int().gte(2000),
  
  // Financial amount (can be positive or negative)
  amount: z.coerce.number(),
  
  // Additional fields specific to our application
  type: z.enum(['monthly-e', 'monthly-o', 'annual']),
  
  // Optional fields for additional context
  depth: z.number().int().min(0).optional(),
  entityName: z.string().optional(),
  isTotal: z.boolean().optional(),
});

/**
 * Schema for validating CSV header rows
 */
export const HeaderRowSchema = z.object({
  header: z.string(),
  columns: z.array(z.string())
});

/**
 * Extended schema for monthly employee CSV rows
 */
export const MonthlyEmployeeRowSchema = FinancialRowSchema.extend({
  type: z.literal('monthly-e'),
  employeeId: z.string().optional(),
  employeeName: z.string().optional(),
});

/**
 * Extended schema for monthly operating CSV rows
 */
export const MonthlyOperatingRowSchema = FinancialRowSchema.extend({
  type: z.literal('monthly-o'),
  departmentId: z.string().optional(),
  departmentName: z.string().optional(),
});

/**
 * Extended schema for annual CSV rows
 */
export const AnnualRowSchema = FinancialRowSchema.extend({
  type: z.literal('annual'),
});

/**
 * Type definitions derived from the schemas
 */
export type FinancialRow = z.infer<typeof FinancialRowSchema>;
export type HeaderRow = z.infer<typeof HeaderRowSchema>;
export type MonthlyEmployeeRow = z.infer<typeof MonthlyEmployeeRowSchema>;
export type MonthlyOperatingRow = z.infer<typeof MonthlyOperatingRowSchema>;
export type AnnualRow = z.infer<typeof AnnualRowSchema>;