/**
 * Utility to extract real doctor data from E-type employee files
 */

/**
 * Extracts actual employee data from the monthly E-type CSV files
 * This function directly pulls the data from the CSV files without calculations
 */
export function extractRealDoctorData(monthlyData: any) {
  console.log("Extracting real employee data directly from E-type files");
  
  if (!monthlyData) {
    console.warn("No monthly data available");
    return [];
  }
  
  const employeeData: {[key: string]: {revenue: number, expenses: number, net: number}} = {};
  
  // Process all months that have E-type data
  Object.keys(monthlyData).forEach(month => {
    const eData = monthlyData[month]?.e;
    
    if (eData && eData.entityColumns && eData.entityColumns.length > 0) {
      console.log(`Processing ${month} E file with ${eData.entityColumns.length} employee columns`);
      
      // Get all employees from entity columns
      eData.entityColumns.forEach((employee: string) => {
        // Skip summary columns that aren't employee names
        if (employee.toLowerCase().includes('total') || 
            employee.toLowerCase().includes('summary') ||
            employee === 'Line Item') {
          return;
        }
        
        console.log(`Found employee: ${employee}`);
        
        // Initialize employee data if not present
        if (!employeeData[employee]) {
          employeeData[employee] = {
            revenue: 0,
            expenses: 0,
            net: 0
          };
        }
        
        if (eData.lineItems && eData.lineItems.length > 0) {
          // Find the revenue total line - typically has "Total Revenue" in the name
          const revenueTotalLine = eData.lineItems.find((item: any) => 
            item.name.toLowerCase().includes('total revenue') || 
            (item.name.toLowerCase().includes('revenue') && item.isTotal)
          );
          
          // Find the expenses total line - typically has "Total Operating Expenses" in the name
          const expensesTotalLine = eData.lineItems.find((item: any) => 
            item.name.toLowerCase().includes('total operating expenses') || 
            (item.name.toLowerCase().includes('expenses') && item.isTotal)
          );
          
          // Find the net income line - typically has "Net Income" in the name
          const netIncomeLine = eData.lineItems.find((item: any) => 
            item.name.toLowerCase().includes('net income') ||
            (item.name.toLowerCase().includes('net') && item.isTotal)
          );
          
          // Extract the values directly from the CSV data
          if (revenueTotalLine && revenueTotalLine.entityValues && revenueTotalLine.entityValues[employee]) {
            const val = Number(revenueTotalLine.entityValues[employee]) || 0;
            employeeData[employee].revenue += val;
            console.log(`${employee} revenue: ${val}`);
          }
          
          if (expensesTotalLine && expensesTotalLine.entityValues && expensesTotalLine.entityValues[employee]) {
            const val = Number(expensesTotalLine.entityValues[employee]) || 0;
            employeeData[employee].expenses += val;
            console.log(`${employee} expenses: ${val}`);
          }
          
          // Use the actual Net Income line from the data
          if (netIncomeLine && netIncomeLine.entityValues && netIncomeLine.entityValues[employee]) {
            const val = Number(netIncomeLine.entityValues[employee]) || 0;
            employeeData[employee].net += val;
            console.log(`${employee} net income: ${val}`);
          }
        }
      });
    }
  });
  
  console.log(`Found data for ${Object.keys(employeeData).length} employees`);
  
  // Convert the employee data object to an array for the UI
  return Object.keys(employeeData)
    .filter(name => name.trim() !== '') // Remove any empty employee names
    .map(name => ({
      name,
      revenue: employeeData[name].revenue,
      expenses: employeeData[name].expenses,
      net: employeeData[name].net
    }))
    .filter(doc => doc.revenue !== 0 || doc.expenses !== 0 || doc.net !== 0) // Only include employees with actual data
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
}