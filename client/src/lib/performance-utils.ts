/**
 * Utility functions for extracting doctor performance data
 * from monthly CSV files (E-type files) for analytics dashboards
 */

import { parseFinancialValue } from "./csv-parser";

/**
 * Extracts doctor performance data from monthly employee CSV data
 */
export function extractDoctorPerformanceData(monthlyData: any) {
  console.log("Extracting doctor data from monthly files");
  
  const result = [];
  
  // Process all available months
  for (const month in monthlyData) {
    if (!monthlyData[month]?.e?.lineItems || !monthlyData[month]?.e?.entityColumns) {
      continue;
    }
    
    const lineItems = monthlyData[month].e.lineItems;
    const entityColumns = monthlyData[month].e.entityColumns.filter(
      (col: string) => col !== 'Line Item' && col.trim() !== ''
    );
    
    // Find the total revenue, total expenses and net income rows
    const totalRevenueRow = lineItems.find((item: any) => 
      item['Line Item']?.toLowerCase().includes('total revenue'));
    
    const totalExpensesRow = lineItems.find((item: any) => 
      item['Line Item']?.toLowerCase().includes('total operating expenses') || 
      item['Line Item']?.toLowerCase().includes('total expense'));
    
    const netIncomeRow = lineItems.find((item: any) => 
      item['Line Item']?.toLowerCase().includes('net income') || 
      item['Line Item']?.toLowerCase().includes('net profit'));
    
    if (!totalRevenueRow || !totalExpensesRow || !netIncomeRow) {
      console.warn(`Missing key financial rows for ${month}`);
      continue;
    }
    
    // For each doctor/employee, extract their financial data
    for (const doctor of entityColumns) {
      const doctorName = doctor.trim();
      
      // Skip empty columns
      if (!doctorName) continue;
      
      // Extract revenue, expenses and net income for each doctor
      const revenue = parseFinancialValue(totalRevenueRow[doctor] || '0');
      const expenses = parseFinancialValue(totalExpensesRow[doctor] || '0');
      const netIncome = parseFinancialValue(netIncomeRow[doctor] || '0');
      
      result.push({
        name: doctorName,
        month: month.toLowerCase(),
        revenue,
        expenses,
        netIncome
      });
    }
  }
  
  return result;
}