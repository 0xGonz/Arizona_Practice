/**
 * Utility functions for extracting doctor and department performance data
 * from monthly CSV data for use in performance dashboards
 */

/**
 * Extracts doctor/provider performance data from monthly employee CSV data
 */
export function extractDoctorPerformanceData(monthlyData: any) {
  if (!monthlyData) return [];
  
  const result: {
    name: string;
    revenue: number;
    expenses: number;
    net: number;
  }[] = [];
  
  // Find all available months
  const months = Object.keys(monthlyData || {});
  
  // For each month, extract doctor performance data from 'e' (employee) type
  months.forEach(month => {
    const monthData = monthlyData[month]?.e;
    
    if (monthData?.lineItems && Array.isArray(monthData.lineItems)) {
      // Get all entity columns which represent doctors/providers
      const doctorColumns = monthData.entityColumns || [];
      
      // Skip if no entity columns found
      if (doctorColumns.length === 0) return;
      
      // Find revenue, expense total, and calculate net income for each doctor
      doctorColumns.forEach(doctor => {
        // Skip if not a doctor name (like summary columns)
        if (doctor.includes('All') || doctor.includes('Summary') || !doctor.trim()) return;
        
        // Find Revenue items
        const revenueItems = monthData.lineItems.filter((item: any) => 
          item.name.includes('Revenue') || 
          item.name.includes('Income') ||
          item.name.toLowerCase().includes('charges')
        );
        
        // Find Expense items
        const expenseItems = monthData.lineItems.filter((item: any) => 
          item.name.includes('Expense') || 
          item.name.includes('Cost') ||
          (item.name.toLowerCase().includes('total') && item.name.toLowerCase().includes('expense'))
        );
        
        // Calculate totals
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        revenueItems.forEach((item: any) => {
          if (item.entityValues && item.entityValues[doctor] !== undefined) {
            totalRevenue += parseFloat(item.entityValues[doctor] || 0);
          }
        });
        
        expenseItems.forEach((item: any) => {
          if (item.entityValues && item.entityValues[doctor] !== undefined) {
            totalExpenses += parseFloat(item.entityValues[doctor] || 0);
          }
        });
        
        // Calculate net income
        const netIncome = totalRevenue - totalExpenses;
        
        // Find existing doctor in result or create new entry
        const existingDoctorIndex = result.findIndex(d => d.name === doctor);
        
        if (existingDoctorIndex >= 0) {
          // Update existing doctor data
          result[existingDoctorIndex].revenue += totalRevenue;
          result[existingDoctorIndex].expenses += totalExpenses;
          result[existingDoctorIndex].net += netIncome;
        } else {
          // Add new doctor
          result.push({
            name: doctor,
            revenue: totalRevenue,
            expenses: totalExpenses,
            net: netIncome
          });
        }
      });
    }
  });
  
  // Sort by net income (descending)
  return result.sort((a, b) => b.net - a.net);
}

/**
 * Extracts department performance data from monthly business CSV data
 */
export function extractDepartmentPerformanceData(monthlyData: any) {
  if (!monthlyData) return [];
  
  const result: {
    name: string;
    revenue: number;
    expenses: number;
    net: number;
  }[] = [];
  
  // Track departments we've already processed
  const processedDepartments = new Set<string>();
  
  // Find all available months
  const months = Object.keys(monthlyData || {});
  
  // Process department data from 'o' (other business) type
  months.forEach(month => {
    const monthData = monthlyData[month]?.o;
    
    if (monthData?.lineItems && Array.isArray(monthData.lineItems)) {
      // Find all departments by looking for department-level line items
      // These are often at depth 1 or 2 and represent expense/revenue centers
      const departmentItems = monthData.lineItems.filter((item: any) => 
        (item.depth === 1 || item.depth === 2) &&
        !item.name.includes('Total') &&
        !item.name.includes('Revenue') &&
        !item.name.includes('Expense') &&
        item.name.trim() !== ''
      );
      
      // Process each potential department
      departmentItems.forEach((dept: any) => {
        const deptName = dept.name.trim();
        
        // Skip if we already processed this department or if it's not a valid name
        if (processedDepartments.has(deptName) || deptName.length < 3) return;
        
        // Mark as processed
        processedDepartments.add(deptName);
        
        // Find all line items that might be part of this department
        // Look for items with name containing the department name or with similar structure
        const deptLineItems = monthData.lineItems.filter((item: any) => 
          (item.name.includes(deptName) || 
           (item.depth > dept.depth && item.id.startsWith(dept.id.split('-')[0])))
        );
        
        // Calculate department metrics from summary column
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        deptLineItems.forEach((item: any) => {
          // Check if this is a revenue or expense item
          const isRevenue = 
            item.name.includes('Revenue') || 
            item.name.includes('Income') ||
            item.name.toLowerCase().includes('charges');
            
          const isExpense = 
            item.name.includes('Expense') || 
            item.name.includes('Cost') ||
            item.name.toLowerCase().includes('salary');
          
          // Get value from summary column
          const value = parseFloat(item.summaryValue || 0);
          
          if (isRevenue) {
            totalRevenue += value;
          } else if (isExpense) {
            totalExpenses += value;
          }
        });
        
        // Only add departments with actual data
        if (totalRevenue > 0 || totalExpenses > 0) {
          const netIncome = totalRevenue - totalExpenses;
          
          // Find existing department or create new
          const existingDeptIndex = result.findIndex(d => d.name === deptName);
          
          if (existingDeptIndex >= 0) {
            // Update existing department data
            result[existingDeptIndex].revenue += totalRevenue;
            result[existingDeptIndex].expenses += totalExpenses;
            result[existingDeptIndex].net += netIncome;
          } else {
            // Add new department
            result.push({
              name: deptName,
              revenue: totalRevenue,
              expenses: totalExpenses,
              net: netIncome
            });
          }
        }
      });
    }
  });
  
  // Sort by revenue (descending)
  return result.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Extracts monthly performance trends from all monthly data
 * Useful for charts showing performance over time
 */
export function extractMonthlyPerformanceTrend(monthlyData: any) {
  if (!monthlyData) return [];
  
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
  
  // Process each month
  const months = Object.keys(monthlyData || {});
  
  months.forEach(month => {
    const eData = monthlyData[month]?.e;
    
    let monthRevenue = 0;
    let monthExpenses = 0;
    
    // Process employee data ONLY for consistency with individual month views
    if (eData?.lineItems && Array.isArray(eData.lineItems)) {
      // Look for specific line items that represent overall totals
      const revenueTotal = eData.lineItems.find((item: any) => 
        item.name.includes('Total Revenue') ||
        item.name.includes('Revenue Total')
      );
      
      const expenseTotal = eData.lineItems.find((item: any) => 
        item.name.includes('Total Expense') ||
        item.name.includes('Expense Total')
      );
      
      // If we found totals, use them directly
      if (revenueTotal && revenueTotal.summaryValue !== undefined) {
        monthRevenue = parseFloat(revenueTotal.summaryValue || 0);
      } else {
        // Otherwise sum individual revenue items
        const revItems = eData.lineItems.filter((item: any) => 
          (item.name.includes('Revenue') || item.name.includes('Income')) &&
          !item.name.includes('Total') &&
          item.summaryValue !== undefined
        );
        
        revItems.forEach((item: any) => {
          monthRevenue += parseFloat(item.summaryValue || 0);
        });
      }
      
      if (expenseTotal && expenseTotal.summaryValue !== undefined) {
        monthExpenses = parseFloat(expenseTotal.summaryValue || 0);
      } else {
        // Otherwise sum individual expense items
        const expItems = eData.lineItems.filter((item: any) => 
          (item.name.includes('Expense') || item.name.includes('Cost')) &&
          !item.name.includes('Total') &&
          item.summaryValue !== undefined
        );
        
        expItems.forEach((item: any) => {
          monthExpenses += parseFloat(item.summaryValue || 0);
        });
      }
      
      // Find Net Income line item if it exists (most accurate)
      const netIncomeItem = eData.lineItems.find((item: any) => 
        item.name.includes('Net Income') ||
        item.name.includes('Net Profit') ||
        item.name.includes('Net Loss')
      );
      
      // If we found a net income item and it has a summary value, use it to validate
      if (netIncomeItem && netIncomeItem.summaryValue !== undefined) {
        const directNetIncome = parseFloat(netIncomeItem.summaryValue || 0);
        // If the calculated net is significantly different, use the direct value
        if (Math.abs((monthRevenue - monthExpenses) - directNetIncome) > 1000) {
          monthRevenue = directNetIncome + monthExpenses;
        }
      }
    }
    
    // Calculate net income
    const netIncome = monthRevenue - monthExpenses;
    
    // Add month to result with properly formatted name
    const monthLower = month.toLowerCase();
    const displayMonth = monthAbbrev[monthLower] || month.substring(0, 3);
    
    result.push({
      month: displayMonth,
      revenue: monthRevenue,
      expenses: monthExpenses,
      net: netIncome
    });
  });
  
  // Sort months in calendar order
  return result.sort((a, b) => {
    const aIndex = Object.values(monthAbbrev).findIndex(m => m === a.month);
    const bIndex = Object.values(monthAbbrev).findIndex(m => m === b.month);
    return aIndex - bIndex;
  });
}

/**
 * Extracts ancillary data for ROI analysis from monthly business data
 */
export function extractAncillaryMetrics(monthlyData: any) {
  if (!monthlyData) {
    return {
      revenue: 0,
      expenses: 0,
      profitMargin: 0,
      roi: 0
    };
  }
  
  let totalRevenue = 0;
  let totalExpenses = 0;
  
  // Find all available months
  const months = Object.keys(monthlyData || {});
  
  // Process ancillary data from 'o' (other business) type
  months.forEach(month => {
    const monthData = monthlyData[month]?.o;
    
    if (monthData?.lineItems && Array.isArray(monthData.lineItems)) {
      // Look for ancillary services
      // These typically include imaging, lab, therapy, etc.
      const ancillaryKeywords = [
        'lab', 'imaging', 'mri', 'ultrasound', 'x-ray', 'therapy', 
        'physical therapy', 'ancillary', 'diagnostic'
      ];
      
      // Find all line items that might be ancillary services
      const ancillaryItems = monthData.lineItems.filter((item: any) => 
        ancillaryKeywords.some(keyword => 
          item.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // Calculate ancillary metrics from these items
      ancillaryItems.forEach((item: any) => {
        const isRevenue = 
          item.name.includes('Revenue') || 
          item.name.includes('Income') ||
          (item.name.toLowerCase().includes('charge') && !item.name.toLowerCase().includes('expense'));
          
        const isExpense = 
          item.name.includes('Expense') || 
          item.name.includes('Cost') ||
          item.name.toLowerCase().includes('salary');
        
        // Get value from summary column
        const value = parseFloat(item.summaryValue || 0);
        
        if (isRevenue) {
          totalRevenue += value;
        } else if (isExpense) {
          totalExpenses += value;
        }
      });
    }
  });
  
  // Calculate derived metrics
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
  const roi = totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0;
  
  return {
    revenue: totalRevenue,
    expenses: totalExpenses,
    profitMargin: Math.round(profitMargin * 10) / 10, // Round to 1 decimal
    roi: Math.round(roi * 10) / 10 // Round to 1 decimal
  };
}