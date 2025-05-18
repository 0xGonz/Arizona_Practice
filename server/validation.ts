import { FinancialRowSchema, MonthlyEmployeeRowSchema, MonthlyOperatingRowSchema, AnnualRowSchema } from "@shared/validation/FinancialRowSchema";
import { CSVFileType } from "@shared/schema";

/**
 * Validates raw CSV data against appropriate schema based on file type
 * Returns validation errors if any are found
 */
export function validateCSVData(data: any[], fileType: CSVFileType, month?: string) {
  // Skip empty data sets
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      valid: false,
      errors: [{ row: 0, message: "No data provided or data is not an array" }]
    };
  }

  const errors: Array<{ row: number, message: string }> = [];
  const validatedRows: any[] = [];

  // Determine which schema to use based on file type
  const getSchemaForType = () => {
    switch (fileType) {
      case 'monthly-e':
        return MonthlyEmployeeRowSchema;
      case 'monthly-o':
        return MonthlyOperatingRowSchema;
      case 'annual':
        return AnnualRowSchema;
      default:
        return FinancialRowSchema;
    }
  };

  const schema = getSchemaForType();

  // Process each row
  data.forEach((row, index) => {
    // Add type and month information automatically
    const enrichedRow = {
      ...row,
      type: fileType,
      month: month || 'Jan', // Default to January if no month provided
      year: new Date().getFullYear() // Default to current year
    };

    // Validate the row against the schema
    const result = schema.safeParse(enrichedRow);
    
    if (!result.success) {
      // Extract error information
      const formattedErrors = result.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      // Add to our errors collection
      errors.push({
        row: index,
        message: `Row ${index} validation failed: ${formattedErrors.map(e => `${e.path}: ${e.message}`).join(', ')}`
      });
    } else {
      // Add validated row to our collection
      validatedRows.push(result.data);
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors,
    validatedData: validatedRows
  };
}