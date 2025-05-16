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
  
  // Define the known department list based on actual data from O CSV files
  const knownDepartments = [
    "CBD", "Pharmacy", "DME", "Procedure Charges", "Imaging", 
    "IncrediWear", "Massage Therapy", "MedShip", "Mobile MRI", 
    "MRI", "NXT STIM", "Physical Therapy", "UDA", "Therapy"
  ];

  // Find all available months
  const months = Object.keys(monthlyData || {});
  
  // Process only O-file data since these are the proper business departments
  months.forEach(month => {
    const monthData = monthlyData[month]?.o;
    
    if (monthData?.lineItems && Array.isArray(monthData.lineItems)) {
      console.log(`Processing O-file data for ${month} to extract department data`);
      
      // First approach: Directly search for known departments by name
      knownDepartments.forEach((deptName) => {
        // Find any line items that mention this department
        const deptItems = monthData.lineItems.filter((item: any) => {
          const itemName = item.name.toLowerCase();
          const searchName = deptName.toLowerCase();
          
          // Handle special cases for departments that might be named differently
          if (searchName === "physical therapy" && itemName.includes("therapy")) return true;
          if (searchName === "imaging" && (itemName.includes("imaging") || itemName.includes("mri"))) return true;
          if (searchName === "mobile mri" && (itemName.includes("mobile") && itemName.includes("mri"))) return true;
          
          // Standard search
          return itemName.includes(searchName);
        });
        
        // Extract financial data for this department
        let deptRevenue = 0;
        let deptExpenses = 0;
        
        // Process all items related to this department
        deptItems.forEach((item: any) => {
          // Check if this is a revenue item
          const isRevenue = 
            item.name.toLowerCase().includes("revenue") || 
            item.name.toLowerCase().includes("income") ||
            item.name.toLowerCase().includes("charges") ||
            item.name.toLowerCase().includes("collections");
          
          // Check if this is an expense item
          const isExpense = 
            item.name.toLowerCase().includes("expense") || 
            item.name.toLowerCase().includes("cost") ||
            item.name.toLowerCase().includes("salary") ||
            item.name.toLowerCase().includes("overhead");
          
          // Get the value if present
          if (item.summaryValue !== undefined) {
            const value = parseFloat(item.summaryValue);
            if (!isNaN(value)) {
              if (isRevenue) {
                deptRevenue += value;
              } else if (isExpense) {
                deptExpenses += value;
              } else if (value > 0) {
                // If we can't determine the type but it's positive, assume revenue
                deptRevenue += value;
              } else if (value < 0) {
                // If negative, treat as expense (absolute value)
                deptExpenses += Math.abs(value);
              }
            }
          }
        });
        
        // If we found financial data for this department, add it to the results
        if (deptRevenue > 0 || deptExpenses > 0) {
          // Check if we already have this department in our results
          const existingDept = result.find(d => d.name === deptName);
          
          if (existingDept) {
            // Update existing department data
            existingDept.revenue += deptRevenue;
            existingDept.expenses += deptExpenses;
            existingDept.net = existingDept.revenue - existingDept.expenses;
          } else {
            // Add new department
            result.push({
              name: deptName,
              revenue: deptRevenue,
              expenses: deptExpenses,
              net: deptRevenue - deptExpenses
            });
          }
        }
      });
      
      // Second approach: Look for items that have a distinct depth pattern
      // In many CSVs, departments are at a specific hierarchical level (depth)
      const potentialDeptItems = monthData.lineItems.filter((item: any) => 
        (item.depth === 1 || item.depth === 2) &&
        !item.name.toLowerCase().includes("total") &&
        !item.name.toLowerCase().includes("revenue") &&
        !item.name.toLowerCase().includes("expense") &&
        !item.name.toLowerCase().includes("income") &&
        item.name.trim().length > 2
      );
      
      potentialDeptItems.forEach((item: any) => {
        const deptName = item.name.trim();
        
        // Skip if this is already a known department or has generic terms
        if (knownDepartments.some(d => deptName.includes(d)) ||
            deptName.toLowerCase().includes("summary") ||
            deptName.toLowerCase().includes("subtotal")) {
          return;
        }
        
        // Try to find revenue/expense data for this potential department
        let revenue = 0;
        let expenses = 0;
        
        // Look for revenue/expense items that might be children of this item
        const childItems = monthData.lineItems.filter((child: any) => 
          child.depth > item.depth && 
          child.id && 
          item.id && 
          child.id.startsWith(item.id.split('-')[0])
        );
        
        childItems.forEach((child: any) => {
          if (child.summaryValue !== undefined) {
            const value = parseFloat(child.summaryValue);
            if (!isNaN(value)) {
              if (child.name.toLowerCase().includes("revenue") || 
                  child.name.toLowerCase().includes("income") ||
                  child.name.toLowerCase().includes("charges")) {
                revenue += value;
              } else if (child.name.toLowerCase().includes("expense") || 
                      child.name.toLowerCase().includes("cost")) {
                expenses += value;
              }
            }
          }
        });
        
        // If we found financial data, add this as a department
        if (revenue > 0 || expenses > 0) {
          // Skip adding this department if we already have it
          if (!result.some(d => d.name === deptName)) {
            result.push({
              name: deptName,
              revenue: revenue,
              expenses: expenses,
              net: revenue - expenses
            });
          }
        }
      });
    }
  });
  
  // If we couldn't find any departments, add the known departments with zeros
  if (result.length === 0) {
    // Force add the known departments even if we don't have data
    // This ensures the dropdown shows the proper departments
    knownDepartments.forEach(deptName => {
      result.push({
        name: deptName,
        revenue: 0,
        expenses: 0,
        net: 0
      });
    });
  }
  
  // Sort by revenue (descending)
  return result.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Extracts monthly performance trends from all monthly data
 * Useful for charts showing performance over time
 * This function now supports both employee (E) and other business (O) data
 * depending on the context in which it's used
 */
export function extractMonthlyPerformanceTrend(monthlyData: any, fileType: 'e' | 'o' = 'e') {
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
    // First try to get data from the specified file type
    let monthData = monthlyData[month]?.[fileType];
    
    // If no data for the specified type, try the other type as fallback
    if (!monthData?.lineItems && monthlyData[month]) {
      const otherType = fileType === 'e' ? 'o' : 'e';
      monthData = monthlyData[month]?.[otherType];
      
      if (monthData?.lineItems) {
        console.log(`Using ${otherType} data as fallback for month ${month} in trend chart`);
      }
    }
    
    let monthRevenue = 0;
    let monthExpenses = 0;
    
    // Process data if it exists for this month
    if (monthData?.lineItems && Array.isArray(monthData.lineItems)) {
      // Look for specific line items that represent overall totals
      const revenueTotal = monthData.lineItems.find((item: any) => 
        item.name.includes('Total Revenue') ||
        item.name.includes('Revenue Total') ||
        item.name === 'Revenue'
      );
      
      const expenseTotal = monthData.lineItems.find((item: any) => 
        item.name.includes('Total Expense') ||
        item.name.includes('Expense Total') ||
        item.name === 'Expenses'
      );
      
      // If we found totals, use them directly
      if (revenueTotal && revenueTotal.summaryValue !== undefined) {
        monthRevenue = parseFloat(revenueTotal.summaryValue || 0);
      } else {
        // Otherwise sum individual revenue items
        const revItems = monthData.lineItems.filter((item: any) => 
          (item.name.includes('Revenue') || 
           item.name.includes('Income') ||
           item.name.toLowerCase().includes('charges')) &&
          !item.name.includes('Total') &&
          item.summaryValue !== undefined
        );
        
        revItems.forEach((item: any) => {
          const value = parseFloat(item.summaryValue || 0);
          if (!isNaN(value)) {
            monthRevenue += value;
          }
        });
      }
      
      if (expenseTotal && expenseTotal.summaryValue !== undefined) {
        monthExpenses = parseFloat(expenseTotal.summaryValue || 0);
      } else {
        // Otherwise sum individual expense items
        const expItems = monthData.lineItems.filter((item: any) => 
          (item.name.includes('Expense') || 
           item.name.includes('Cost') ||
           item.name.toLowerCase().includes('salary')) &&
          !item.name.includes('Total') &&
          item.summaryValue !== undefined
        );
        
        expItems.forEach((item: any) => {
          const value = parseFloat(item.summaryValue || 0);
          if (!isNaN(value)) {
            monthExpenses += value;
          }
        });
      }
      
      // Find Net Income line item if it exists (most accurate)
      const netIncomeItem = monthData.lineItems.find((item: any) => 
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
      
      // If we still don't have data, look for values in the entity columns
      if (monthRevenue === 0 && monthExpenses === 0 && monthData.entityColumns) {
        // Try to find a summary column or use the first entity column
        const summaryCol = monthData.summaryColumn || (monthData.entityColumns.length > 0 ? monthData.entityColumns[0] : null);
        
        if (summaryCol) {
          // Find total values in the summary column
          monthData.lineItems.forEach((item: any) => {
            if (item.entityValues && summaryCol in item.entityValues) {
              const value = parseFloat(item.entityValues[summaryCol] || 0);
              
              if (!isNaN(value)) {
                if (item.name.includes('Revenue') || item.name.includes('Income')) {
                  monthRevenue += value;
                } else if (item.name.includes('Expense') || item.name.includes('Cost')) {
                  monthExpenses += value;
                }
              }
            }
          });
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