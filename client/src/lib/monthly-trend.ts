/**
 * Utility functions for extracting monthly performance trends from CSV data
 */

/**
 * Extract monthly performance trend data for charts using actual data from the CSV files
 */
export function extractMonthlyPerformanceTrend(monthlyData: any, fileType: 'e' | 'o' = 'e') {
  // Standard month order for sorting
  const monthOrder = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  // Short month names for display
  const monthAbbrev: Record<string, string> = {
    'january': 'Jan',
    'february': 'Feb',
    'march': 'Mar',
    'april': 'Apr',
    'may': 'May',
    'june': 'Jun',
    'july': 'Jul',
    'august': 'Aug',
    'september': 'Sep',
    'october': 'Oct',
    'november': 'Nov',
    'december': 'Dec'
  };
  
  const result: {
    month: string;
    revenue: number;
    expenses: number;
    net: number;
  }[] = [];
  
  // Extract data directly from the monthly data in the store
  if (monthlyData) {
    Object.keys(monthlyData).forEach(month => {
      const monthData = monthlyData[month];
      if (monthData && monthData[fileType] && monthData[fileType].lineItems) {
        // Find revenue total line - typically has "Total Revenue" in the name
        const revenueTotalLine = monthData[fileType].lineItems.find((item: any) => 
          item.name.toLowerCase().includes('total revenue') || 
          (item.name.toLowerCase().includes('revenue') && item.isTotal)
        );
        
        // Find expenses total line - typically has "Total Operating Expenses" in the name
        const expensesTotalLine = monthData[fileType].lineItems.find((item: any) => 
          item.name.toLowerCase().includes('total operating expenses') || 
          (item.name.toLowerCase().includes('expenses') && item.isTotal)
        );
        
        // Find the net income line - typically has "Net Income" in the name
        const netIncomeLine = monthData[fileType].lineItems.find((item: any) => 
          item.name.toLowerCase().includes('net income') ||
          (item.name.toLowerCase().includes('net') && item.isTotal)
        );
        
        // Extract values from the summary column if available
        let revenue = 0;
        let expenses = 0;
        let net = 0;
        
        if (revenueTotalLine) {
          revenue = revenueTotalLine.summaryValue || 0;
        }
        
        if (expensesTotalLine) {
          expenses = expensesTotalLine.summaryValue || 0;
        }
        
        if (netIncomeLine) {
          net = netIncomeLine.summaryValue || 0;
        } else if (revenue !== 0 && expenses !== 0) {
          // Calculate net if not found
          net = revenue - expenses;
        }
        
        // Only add months with actual data
        if (revenue !== 0 || expenses !== 0 || net !== 0) {
          result.push({
            month: monthAbbrev[month.toLowerCase()] || month,
            revenue,
            expenses,
            net
          });
          
          console.log(`Using actual data from file for ${month} (${fileType}): Revenue=${revenue}, Expenses=${expenses}, Net=${net}`);
        }
      }
    });
  }
  
  // Sort by month order and return
  return result.sort((a, b) => {
    const monthA = Object.keys(monthAbbrev).find(m => monthAbbrev[m] === a.month) || '';
    const monthB = Object.keys(monthAbbrev).find(m => monthAbbrev[m] === b.month) || '';
    return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
  });
}