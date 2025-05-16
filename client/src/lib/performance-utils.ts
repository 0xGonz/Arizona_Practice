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
  
  // Track all doctors across all months
  const allDoctors: Set<string> = new Set();
  
  // First, gather all the doctor names from all months
  Object.keys(monthlyData || {}).forEach(month => {
    const monthData = monthlyData[month]?.e;
    
    if (monthData?.entityColumns && Array.isArray(monthData.entityColumns)) {
      monthData.entityColumns.forEach((doctor: string) => {
        // Skip summary columns
        if (!doctor.includes('All') && !doctor.includes('Summary') && doctor.trim()) {
          allDoctors.add(doctor);
        }
      });
    }
  });
  
  // Now process each doctor across all months
  allDoctors.forEach(doctor => {
    let doctorRevenue = 0;
    let doctorExpenses = 0;
    let doctorNet = 0;
    
    // Process each month's data for this doctor
    Object.keys(monthlyData || {}).forEach(month => {
      const monthData = monthlyData[month]?.e;
      
      if (monthData?.lineItems && Array.isArray(monthData.lineItems) && 
          monthData.entityColumns && monthData.entityColumns.includes(doctor)) {
        
        // Look for Net Income line first - most accurate
        const netIncomeItem = monthData.lineItems.find((item: any) => 
          (item.name.includes('Net Income') || 
           item.name.includes('Net Profit') || 
           item.name.includes('Net Loss')) && 
          item.entityValues && 
          item.entityValues[doctor] !== undefined
        );
        
        // Also look for specific revenue and expense totals
        const revenueTotalItem = monthData.lineItems.find((item: any) => 
          (item.name.includes('Total Revenue') || 
           item.name.includes('Revenue Total')) && 
          item.entityValues && 
          item.entityValues[doctor] !== undefined
        );
        
        const expenseTotalItem = monthData.lineItems.find((item: any) => 
          (item.name.includes('Total Expense') || 
           item.name.includes('Expense Total')) && 
          item.entityValues && 
          item.entityValues[doctor] !== undefined
        );
        
        // Use totals if found
        if (revenueTotalItem) {
          doctorRevenue += parseFloat(revenueTotalItem.entityValues[doctor] || 0);
        }
        
        if (expenseTotalItem) {
          doctorExpenses += parseFloat(expenseTotalItem.entityValues[doctor] || 0);
        }
        
        // Calculate net from totals if both found
        if (revenueTotalItem && expenseTotalItem) {
          const monthNetIncome = parseFloat(revenueTotalItem.entityValues[doctor] || 0) - 
                                 parseFloat(expenseTotalItem.entityValues[doctor] || 0);
          doctorNet += monthNetIncome;
        } 
        // If we found a specific net income line, use that
        else if (netIncomeItem) {
          doctorNet += parseFloat(netIncomeItem.entityValues[doctor] || 0);
          
          // If we only have net and one of revenue/expense, derive the other
          if (revenueTotalItem && !expenseTotalItem) {
            doctorExpenses += parseFloat(revenueTotalItem.entityValues[doctor] || 0) - 
                              parseFloat(netIncomeItem.entityValues[doctor] || 0);
          } else if (!revenueTotalItem && expenseTotalItem) {
            doctorRevenue += parseFloat(expenseTotalItem.entityValues[doctor] || 0) + 
                             parseFloat(netIncomeItem.entityValues[doctor] || 0);
          }
        } 
        // If we didn't find any totals, sum individual items
        else if (!revenueTotalItem && !expenseTotalItem && !netIncomeItem) {
          // Find Revenue items
          const revenueItems = monthData.lineItems.filter((item: any) => 
            (item.name.includes('Revenue') || 
             item.name.includes('Income') ||
             item.name.toLowerCase().includes('charges')) &&
            !item.name.includes('Total') &&
            !item.name.includes('Net') &&
            item.entityValues && 
            item.entityValues[doctor] !== undefined
          );
          
          // Find Expense items
          const expenseItems = monthData.lineItems.filter((item: any) => 
            (item.name.includes('Expense') || 
             item.name.includes('Cost')) &&
            !item.name.includes('Total') &&
            item.entityValues && 
            item.entityValues[doctor] !== undefined
          );
          
          // Sum up individual items
          let monthRevenue = 0;
          let monthExpenses = 0;
          
          revenueItems.forEach((item: any) => {
            monthRevenue += parseFloat(item.entityValues[doctor] || 0);
          });
          
          expenseItems.forEach((item: any) => {
            monthExpenses += parseFloat(item.entityValues[doctor] || 0);
          });
          
          doctorRevenue += monthRevenue;
          doctorExpenses += monthExpenses;
          doctorNet += (monthRevenue - monthExpenses);
        }
      }
    });
    
    // Only add doctor if they have financial data
    if (doctorRevenue !== 0 || doctorExpenses !== 0 || doctorNet !== 0) {
      result.push({
        name: doctor,
        revenue: doctorRevenue,
        expenses: doctorExpenses,
        net: doctorNet
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
  
  // Process department data from 'o' (other business) type ONLY
  // This is important for consistency with what's shown in the "Other Business" (O) monthly files
  months.forEach(month => {
    const monthData = monthlyData[month]?.o;
    
    if (monthData?.lineItems && Array.isArray(monthData.lineItems)) {
      // Find department headers or section items - typically at depth 1 or 2
      const departmentItems = monthData.lineItems.filter((item: any) => 
        (item.depth === 1 || item.depth === 2) &&
        !item.name.includes('Total') &&
        !item.name.includes('Revenue') &&
        !item.name.includes('Expense') &&
        !item.name.includes('Income') &&
        item.name.trim() !== ''
      );
      
      // Process each potential department
      departmentItems.forEach((dept: any) => {
        const deptName = dept.name.trim();
        
        // Skip if we already processed this department, it's not a valid name, or a summary item
        if (processedDepartments.has(deptName) || 
            deptName.length < 3 || 
            deptName.toLowerCase().includes('summary') || 
            deptName.toLowerCase().includes('total')) return;
        
        // Mark as processed
        processedDepartments.add(deptName);
        
        // Find department revenue and expense totals
        // First try to find specific totals for this department
        const revenueTotalItem = monthData.lineItems.find((item: any) => 
          item.name.includes(`${deptName} Revenue`) || 
          item.name.includes(`${deptName} Income`) ||
          (item.name.includes('Revenue') && item.name.includes(deptName))
        );
        
        const expenseTotalItem = monthData.lineItems.find((item: any) => 
          item.name.includes(`${deptName} Expense`) || 
          item.name.includes(`${deptName} Cost`) ||
          (item.name.includes('Expense') && item.name.includes(deptName))
        );
        
        // Initialize totals
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        // If we found specific totals, use them
        if (revenueTotalItem && revenueTotalItem.summaryValue !== undefined) {
          totalRevenue = parseFloat(revenueTotalItem.summaryValue || 0);
        }
        
        if (expenseTotalItem && expenseTotalItem.summaryValue !== undefined) {
          totalExpenses = parseFloat(expenseTotalItem.summaryValue || 0);
        }
        
        // If no direct totals, find all line items within this department
        if (totalRevenue === 0 && totalExpenses === 0) {
          // Find all line items that might be part of this department
          // Look for items with name containing the department name or with similar structure
          const deptLineItems = monthData.lineItems.filter((item: any) => 
            (item.name.includes(deptName) || 
             (item.depth > dept.depth && item.id.startsWith(dept.id.split('-')[0])))
          );
          
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
        }
        
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
  
  // Process ancillary data from 'o' (other business) type ONLY for consistency
  months.forEach(month => {
    const monthData = monthlyData[month]?.o;
    
    if (monthData?.lineItems && Array.isArray(monthData.lineItems)) {
      // Search for defined ancillary departments/sections first
      const ancillaryDeptItems = monthData.lineItems.filter((item: any) => 
        (item.depth === 1 || item.depth === 2) &&
        (
          item.name.toLowerCase().includes('ancillary') ||
          item.name.toLowerCase().includes('diagnostic') ||
          item.name.toLowerCase().includes('lab') ||
          item.name.toLowerCase().includes('imaging')
        )
      );
      
      // If we found specific ancillary departments, use their summaries if available
      if (ancillaryDeptItems.length > 0) {
        ancillaryDeptItems.forEach(dept => {
          const deptName = dept.name.trim();
          
          // Try to find revenue and expense totals for this department
          const revItem = monthData.lineItems.find((item: any) => 
            (item.name.includes(`${deptName} Revenue`) || 
             item.name.includes(`${deptName} Income`)) &&
            item.summaryValue !== undefined
          );
          
          const expItem = monthData.lineItems.find((item: any) => 
            (item.name.includes(`${deptName} Expense`) || 
             item.name.includes(`${deptName} Cost`)) &&
            item.summaryValue !== undefined
          );
          
          if (revItem) {
            totalRevenue += parseFloat(revItem.summaryValue || 0);
          }
          
          if (expItem) {
            totalExpenses += parseFloat(expItem.summaryValue || 0);
          }
        });
      }
      
      // If we didn't find specific departments or their totals, 
      // search for all ancillary line items
      if (totalRevenue === 0 && totalExpenses === 0) {
        // Define keywords for ancillary services
        const ancillaryKeywords = [
          'lab', 'imaging', 'mri', 'ultrasound', 'x-ray', 'therapy', 
          'physical therapy', 'ancillary', 'diagnostic', 'radiology'
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