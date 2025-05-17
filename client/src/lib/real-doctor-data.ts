/**
 * Utility to extract real doctor data from E-type employee files
 */

/**
 * Extracts actual employee data from the monthly E-type CSV files
 * This function processes the raw data to return accurate provider metrics
 */
export function extractRealDoctorData(monthlyData: any) {
  console.log("Extracting real doctor data from monthly E files");
  
  if (!monthlyData) {
    console.warn("No monthly data available");
    return [];
  }
  
  const doctors: {[key: string]: {revenue: number, expenses: number, net: number}} = {};
  
  // Process all months that have E-type data
  Object.keys(monthlyData).forEach(month => {
    const eData = monthlyData[month]?.e;
    
    if (eData && eData.entityColumns && eData.entityColumns.length > 0) {
      // Get the set of doctors/providers from the entity columns
      eData.entityColumns.forEach((doctor: string) => {
        // Skip any non-doctor columns like 'Summary' or 'Total'
        if (doctor.toLowerCase().includes('total') || 
            doctor.toLowerCase().includes('summary')) {
          return;
        }
        
        // Initialize doctor data if not present
        if (!doctors[doctor]) {
          doctors[doctor] = {
            revenue: 0,
            expenses: 0,
            net: 0
          };
        }
        
        // Find revenue and expense totals for this doctor
        if (eData.lineItems && eData.lineItems.length > 0) {
          // Find revenue lines (usually at the top)
          const revenueItems = eData.lineItems.filter((item: any) => 
            item.name.toLowerCase().includes('revenue') && !item.name.toLowerCase().includes('total')
          );
          
          // Find expense lines (usually have 'expense' in the name)
          const expenseItems = eData.lineItems.filter((item: any) => 
            item.name.toLowerCase().includes('expense') && !item.name.toLowerCase().includes('total')
          );
          
          // Find net income or 'total' lines (usually at the bottom)
          const netItems = eData.lineItems.filter((item: any) => 
            (item.name.toLowerCase().includes('net') || 
             item.name.toLowerCase().includes('total')) && 
            item.isTotal
          );
          
          // Add up revenue
          revenueItems.forEach((item: any) => {
            if (item.entityValues && item.entityValues[doctor]) {
              doctors[doctor].revenue += Number(item.entityValues[doctor]) || 0;
            }
          });
          
          // Add up expenses
          expenseItems.forEach((item: any) => {
            if (item.entityValues && item.entityValues[doctor]) {
              doctors[doctor].expenses += Number(item.entityValues[doctor]) || 0;
            }
          });
          
          // Calculate net income (or use the net line if available)
          if (netItems.length > 0 && netItems[0].entityValues && netItems[0].entityValues[doctor]) {
            // Use the net line if available
            doctors[doctor].net += Number(netItems[0].entityValues[doctor]) || 0;
          } else {
            // Otherwise calculate net as revenue - expenses
            const monthNet = doctors[doctor].revenue - doctors[doctor].expenses;
            doctors[doctor].net = monthNet;
          }
        }
      });
    }
  });
  
  // Convert the doctor data object to an array for the UI
  return Object.keys(doctors).map(name => ({
    name,
    revenue: doctors[name].revenue,
    expenses: doctors[name].expenses,
    net: doctors[name].net
  })).filter(doc => doc.revenue !== 0 || doc.expenses !== 0 || doc.net !== 0); // Only include doctors with actual data
}