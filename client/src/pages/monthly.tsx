import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadBanner from "@/components/upload/upload-banner";
import { useStore } from "@/store/data-store";
import { parseFinancialValue } from "@/lib/csv-parser";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function Monthly() {
  const { uploadStatus, monthlyData } = useStore();
  const [activeMonth, setActiveMonth] = useState("January");
  const monthLower = activeMonth.toLowerCase();

  // Extract data for the active month with enhanced logging and error handling
  const monthData = useMemo(() => {
    // Debug all available monthly data
    const availableMonths = Object.keys(monthlyData);
    console.log(`Available months in data store:`, availableMonths);
    console.log(`Looking for monthly data with key: ${monthLower}`);
    
    // Try both direct match and alternative case versions
    const possibleMonthKeys = [
      monthLower,
      monthLower.toLowerCase(),
      activeMonth.toLowerCase(),
      activeMonth
    ];
    
    // Find the first matching month key that exists in monthlyData
    const matchingMonthKey = possibleMonthKeys.find(key => 
      monthlyData[key] && (monthlyData[key]?.e?.length > 0 || monthlyData[key]?.o?.length > 0)
    );
    
    if (!matchingMonthKey) {
      console.log(`No monthly data found for: ${monthLower} (or alternative spellings)`);
      return null;
    }
    
    console.log(`Found monthly data using key: ${matchingMonthKey}`, monthlyData[matchingMonthKey]);
    
    const eData = monthlyData[matchingMonthKey]?.e || [];
    const oData = monthlyData[matchingMonthKey]?.o || [];
    
    // Log the data to help with debugging
    console.log(`Monthly data loaded:`, { 
      eData: eData?.length || 0,
      oData: oData?.length || 0
    });
    
    // Log first few rows to understand structure
    if (eData.length > 0) {
      console.log("First row of monthly data:", eData[0]);
    }
    
    return { eData, oData };
  }, [monthlyData, monthLower, activeMonth]);

  // Calculate financial metrics from the monthly data
  const financialMetrics = useMemo(() => {
    if (!monthData) return null;
    
    const { eData } = monthData;
    
    // First try to find the "All Employees" column by exact match
    let allEmployeesColumn = "All Employees";
    
    // If it doesn't exist, look for columns that might contain "total" or similar keywords
    if (!eData[0] || typeof eData[0][allEmployeesColumn] === 'undefined') {
      const possibleTotalColumns = Object.keys(eData[0] || {}).filter(key => 
        key.toLowerCase().includes('total') ||
        key.toLowerCase().includes('all')
      );
      
      if (possibleTotalColumns.length > 0) {
        allEmployeesColumn = possibleTotalColumns[0];
        console.log("Using alternative total column:", allEmployeesColumn);
      }
    }
    
    // Find revenue rows - look for multiple possible revenue indicators
    const revenueRow = eData.find(row => {
      if (!row['Line Item']) return false;
      const lineItem = row['Line Item'].toLowerCase();
      return (
        lineItem.includes('total revenue') ||
        lineItem.includes('gross revenue') ||
        lineItem.includes('revenue total') ||
        lineItem.includes('total income')
      );
    });
    
    // Find expense rows - look for multiple possible expense indicators
    const expenseRow = eData.find(row => {
      if (!row['Line Item']) return false;
      const lineItem = row['Line Item'].toLowerCase();
      return (
        lineItem.includes('total expense') ||
        lineItem.includes('total operating expense') ||
        lineItem.includes('operating expenses') ||
        lineItem.includes('expense total')
      );
    });
    
    console.log("Found revenue row:", revenueRow?.['Line Item']);
    console.log("Found expense row:", expenseRow?.['Line Item']);
    console.log("Using column for totals:", allEmployeesColumn);
    
    // Calculate totals
    let revenue = 0;
    if (revenueRow) {
      const rawRevenue = revenueRow[allEmployeesColumn] || revenueRow["Total"] || "0";
      try {
        revenue = parseFinancialValue(rawRevenue.toString());
      } catch (e) {
        console.error("Error parsing revenue:", e);
      }
    } else {
      // If we can't find revenue, try to add up all income or revenue rows
      const incomeRows = eData.filter(row => {
        if (!row['Line Item']) return false;
        const lineItem = row['Line Item'].toLowerCase();
        return (
          (lineItem.includes('revenue') || lineItem.includes('income')) &&
          !lineItem.includes('total') &&
          !lineItem.includes('expense')
        );
      });
      
      for (const row of incomeRows) {
        try {
          const value = row[allEmployeesColumn] || row["Total"] || "0";
          revenue += parseFinancialValue(value.toString());
        } catch (e) {
          // Skip rows that can't be parsed
        }
      }
    }
    
    // Calculate expense the same way
    let expenses = 0; 
    if (expenseRow) {
      const rawExpenses = expenseRow[allEmployeesColumn] || expenseRow["Total"] || "0";
      try {
        expenses = parseFinancialValue(rawExpenses.toString());
      } catch (e) {
        console.error("Error parsing expenses:", e);
      }
    } else {
      // If we can't find expenses, try to add up all expense rows
      const expenseRows = eData.filter(row => {
        if (!row['Line Item']) return false;
        const lineItem = row['Line Item'].toLowerCase();
        return (
          lineItem.includes('expense') &&
          !lineItem.includes('total') &&
          !lineItem.includes('revenue')
        );
      });
      
      for (const row of expenseRows) {
        try {
          const value = row[allEmployeesColumn] || row["Total"] || "0";
          expenses += parseFinancialValue(value.toString());
        } catch (e) {
          // Skip rows that can't be parsed
        }
      }
    }
    
    // Calculate net income
    const netIncome = revenue - expenses;
    
    console.log("Calculated metrics:", { revenue, expenses, netIncome });
    
    return { revenue, expenses, netIncome };
  }, [monthData]);

  // Extract column headers (doctor/provider names) from the data
  const columnHeaders = useMemo(() => {
    if (!monthData?.eData?.length) return [];
    
    console.log("First row of monthly data:", monthData.eData[0]);
    
    // Get all column headers except 'Line Item' and 'All Employees'
    const headers = Object.keys(monthData.eData[0] || {})
      .filter(key => 
        key !== 'Line Item' && 
        key !== 'All Employees' && 
        key !== '' && // Filter out empty keys
        key.trim() !== '' // Filter out keys that are just whitespace
      );
    
    console.log("Extracted column headers:", headers);
    
    return headers;
  }, [monthData]);

  // Find the "All Employees" column or similar total column
  const totalsColumn = useMemo(() => {
    if (!monthData?.eData?.length) return "All Employees";
    
    // First try to find common total column names in the actual data
    const commonTotalNames = [
      'All Employees', 
      'Total', 
      'Grand Total',
      'Sum',
      'Total Amount'
    ];
    
    // Check if any of these columns exist directly
    for (const colName of commonTotalNames) {
      if (monthData.eData[0] && typeof monthData.eData[0][colName] !== 'undefined') {
        console.log(`Found direct match for totals column: ${colName}`);
        return colName;
      }
    }
    
    // If no direct match, look for columns containing keywords
    const possibleTotalColumns = Object.keys(monthData.eData[0] || {}).filter(key => 
      key && typeof key === 'string' && (
        key.toLowerCase().includes('total') ||
        key.toLowerCase().includes('all') ||
        key.toLowerCase().includes('sum') ||
        key.toLowerCase().includes('employees')
      )
    );
    
    if (possibleTotalColumns.length > 0) {
      console.log("Using alternative total column:", possibleTotalColumns[0]);
      return possibleTotalColumns[0];
    }
    
    // Finally, look for any empty column name that might be a total column
    const emptyColName = Object.keys(monthData.eData[0] || {}).find(key => key === '');
    if (emptyColName !== undefined) {
      console.log("Using empty column name as potential total column");
      return emptyColName;
    }
    
    // If no total column is found, we'll calculate it by summing all individual values
    console.log("No total column found, will sum individual values from doctor columns");
    return "__calculated_total__"; // Special marker for calculated totals
  }, [monthData]);

  // Extract main line items for the table
  const lineItems = useMemo(() => {
    if (!monthData?.eData?.length) return [];
    
    // Log first few rows to understand data structure
    console.log("Sample monthly data rows:", monthData.eData.slice(0, 3));
    
    // Extract all unique line items to build a hierarchical display
    // Instead of predefined categories, we'll build directly from your CSV data
    
    // Function to determine the indentation level (hierarchy depth) from a line item
    const getLineItemDepth = (lineItem: string): number => {
      if (!lineItem) return 0;
      
      // Count leading spaces to determine hierarchy level
      let leadingSpaces = 0;
      for (let i = 0; i < lineItem.length; i++) {
        if (lineItem[i] === ' ') {
          leadingSpaces++;
        } else {
          break;
        }
      }
      
      // Convert space count to hierarchy depth (roughly 2 spaces per level)
      return Math.floor(leadingSpaces / 2);
    };
    
    // First, get all line items with their depths
    const allLineItems = monthData.eData
      .filter(row => row['Line Item'] && row['Line Item'].trim() !== '')
      .map(row => ({
        name: row['Line Item'].trim(),
        depth: getLineItemDepth(row['Line Item']),
        original: row['Line Item'],
        row: row
      }));
      
    console.log("Extracted line items with depths:", allLineItems.slice(0, 10));
    
    // Build main categories based on the actual structure from your CSV
    // We'll look for key categories like Revenue, Expenses, and Net Income
    
    const mainCategories = [
      { 
        name: 'Revenue', 
        type: 'header', 
        key: 'revenue',
        searchTerms: ['revenue', 'income', 'gross'],
        children: []
      },
      { 
        name: 'Expenses', 
        type: 'header', 
        key: 'expenses',
        searchTerms: ['operating expenses', 'expense', 'cost', 'expenditure'],
        children: []
      },
      { 
        name: 'Net Income', 
        type: 'total', 
        key: 'net_income',
        searchTerms: ['net income', 'profit', 'bottom line', 'net earnings'],
        children: []
      }
    ];
    
    // Populate the children arrays based on the actual line items
    const findMatchingCategory = (lineItem: string) => {
      const lowerLineItem = lineItem.toLowerCase();
      
      for (const category of mainCategories) {
        if (category.searchTerms.some(term => lowerLineItem.includes(term))) {
          return category;
        }
      }
      
      // Default to expenses for most subcategories if no direct match
      if (lowerLineItem.includes('total')) {
        return null; // Skip total rows as we calculate those
      }
      
      // For items that don't clearly fit into a category, make an intelligent guess
      if (lowerLineItem.includes('payroll') || 
          lowerLineItem.includes('salary') || 
          lowerLineItem.includes('wage') ||
          lowerLineItem.includes('administrative') ||
          lowerLineItem.includes('travel') ||
          lowerLineItem.includes('rent') ||
          lowerLineItem.includes('insurance')) {
        return mainCategories[1]; // Expenses
      }
      
      if (lowerLineItem.includes('fee') || 
          lowerLineItem.includes('income') || 
          lowerLineItem.includes('professional')) {
        return mainCategories[0]; // Revenue
      }
      
      return null; // Skip items we can't categorize
    };
    
    // Function to find a row using any of the search terms
    const findRow = (rows, searchTerms) => {
      return rows.find(row => {
        if (!row['Line Item']) return false;
        const lineItem = row['Line Item'].toLowerCase();
        return searchTerms.some(term => lineItem.includes(term.toLowerCase()));
      });
    };
    
    // Function to safely extract a value from a row and column
    const safeExtractValue = (row, columnName) => {
      if (!row) return 0;
      
      // Try different approaches to get a value
      if (typeof row[columnName] !== 'undefined') {
        try {
          const valueStr = row[columnName].toString().trim();
          if (valueStr === '' || valueStr === '  ' || valueStr === '-') return 0;
          return parseFinancialValue(valueStr);
        } catch (e) {
          console.error(`Error parsing value for ${columnName}:`, e);
          return 0;
        }
      }
      
      return 0;
    };

    // Process all the line items in the data
    const processedItems = mainCategories.map(category => {
      // For each category, calculate values for each column
      const values = {};
      
      // For each doctor/provider column, calculate the total
      columnHeaders.forEach(header => {
        let total = 0;
        
        // If this is a main category (Revenue, Expenses, etc.)
        if (category.type === 'header' || category.type === 'total') {
          // Try to find a row with the total directly
          const totalRow = findRow(monthData.eData, category.searchTerms);
          
          if (totalRow) {
            // Found a direct match for the total
            total = safeExtractValue(totalRow, header);
          } else if (category.type === 'header' && category.children) {
            // Calculate total by adding up child rows
            category.children.forEach(child => {
              const childRows = monthData.eData.filter(row => {
                if (!row['Line Item']) return false;
                const lineItem = row['Line Item'].toLowerCase();
                return child.searchTerms.some(term => lineItem.includes(term.toLowerCase()));
              });
              
              childRows.forEach(row => {
                total += safeExtractValue(row, header);
              });
            });
          }
        }
        
        values[header] = total;
      });
      
      // Calculate the total for "All Employees" column
      let totalAllEmployees = 0;
      const totalRow = findRow(monthData.eData, category.searchTerms);
      
      if (totalRow && totalsColumn !== "__calculated_total__") {
        // Use the existing total column if available
        totalAllEmployees = safeExtractValue(totalRow, totalsColumn);
      } else {
        // Calculate totals by summing all columns or using child rows
        if (category.type === 'header' && category.children) {
          // Sum from child categories
          category.children.forEach(child => {
            const childRows = monthData.eData.filter(row => {
              if (!row['Line Item']) return false;
              const lineItem = row['Line Item'].toLowerCase();
              return child.searchTerms.some(term => lineItem.includes(term.toLowerCase()));
            });
            
            childRows.forEach(row => {
              if (totalsColumn !== "__calculated_total__") {
                // Use the specified totals column
                totalAllEmployees += safeExtractValue(row, totalsColumn);
              } else {
                // Calculate by summing all provider columns
                columnHeaders.forEach(header => {
                  totalAllEmployees += safeExtractValue(row, header);
                });
              }
            });
          });
        } else if (totalsColumn === "__calculated_total__") {
          // Sum the column totals we already calculated
          totalAllEmployees = Object.values(values).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
        }
      }
      
      // If this is Net Income and we have financial metrics, use that instead
      if (category.key === 'net_income' && financialMetrics) {
        totalAllEmployees = financialMetrics.netIncome;
      }
      
      values['All Employees'] = totalAllEmployees;
      
      // If this is a main category with children, process the children
      if (category.type === 'header' && category.children) {
        const processedChildren = category.children.map(child => {
          const childValues = {};
          
          // Calculate values for each column
          columnHeaders.forEach(header => {
            let childTotal = 0;
            
            // Find all rows that match this child's search terms
            const childRows = monthData.eData.filter(row => {
              if (!row['Line Item']) return false;
              const lineItem = row['Line Item'].toLowerCase();
              return child.searchTerms.some(term => lineItem.includes(term.toLowerCase()));
            });
            
            // Sum up all the values
            childRows.forEach(row => {
              childTotal += safeExtractValue(row, header);
            });
            
            childValues[header] = childTotal;
          });
          
          // Calculate the total for "All Employees" column
          let childTotalAllEmployees = 0;
          const childRows = monthData.eData.filter(row => {
            if (!row['Line Item']) return false;
            const lineItem = row['Line Item'].toLowerCase();
            return child.searchTerms.some(term => lineItem.includes(term.toLowerCase()));
          });
          
          childRows.forEach(row => {
            childTotalAllEmployees += safeExtractValue(row, totalsColumn);
          });
          
          childValues['All Employees'] = childTotalAllEmployees;
          
          return { ...child, values: childValues };
        });
        
        return { ...category, values, children: processedChildren };
      }
      
      return { ...category, values };
    });
    
    // Calculate Net Income row
    if (processedItems.length > 2) {
      // Get the Net Income row
      const netIncomeItem = processedItems[2];
      
      // Calculate total net income for 'All Employees' column
      if (financialMetrics && financialMetrics.netIncome !== 0) {
        // If we have calculated metrics from the actual data, use them
        netIncomeItem.values['All Employees'] = financialMetrics.netIncome;
      } else {
        // Otherwise calculate from our revenue and expense items
        const totalRevenue = processedItems[0].values['All Employees'] || 0;
        const totalExpenses = processedItems[1].values['All Employees'] || 0;
        netIncomeItem.values['All Employees'] = totalRevenue - totalExpenses;
      }
      
      // Calculate net income for each individual provider column
      columnHeaders.forEach(header => {
        const columnRevenue = processedItems[0].values[header] || 0;
        const columnExpenses = processedItems[1].values[header] || 0;
        netIncomeItem.values[header] = columnRevenue - columnExpenses;
      });
      
      // Log the final net income calculations
      console.log("Net Income calculations:", {
        total: netIncomeItem.values['All Employees'],
        byProvider: columnHeaders.reduce((acc, header) => {
          acc[header] = netIncomeItem.values[header];
          return acc;
        }, {})
      });
    }
    
    console.log("Processed line items:", processedItems);
    
    return processedItems;
  }, [monthData, columnHeaders, financialMetrics, totalsColumn]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark mb-1">Month-by-Month Analysis</h1>
        <p className="text-neutral-text">Detailed monthly financial breakdowns</p>
      </div>

      <Card className="overflow-hidden">
        <Tabs value={activeMonth} onValueChange={setActiveMonth} className="w-full">
          <TabsList className="flex overflow-x-auto scrollbar-hide border-b border-neutral-border rounded-none bg-white h-auto">
            {months.map((month) => {
              const monthlyStatus = uploadStatus.monthly[month.toLowerCase()];
              const isActive = activeMonth === month;
              const isDisabled = !monthlyStatus?.e && !monthlyStatus?.o;
              
              return (
                <TabsTrigger
                  key={month}
                  value={month}
                  disabled={isDisabled}
                  className={`flex-none px-6 py-4 ${
                    isActive 
                      ? "text-primary border-b-2 border-primary font-medium" 
                      : "text-neutral-text hover:text-neutral-dark"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {month}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {months.map((month) => {
            const monthLower = month.toLowerCase();
            const monthlyStatus = uploadStatus.monthly[monthLower];
            const eUploaded = !!monthlyStatus?.e;
            const oUploaded = !!monthlyStatus?.o;
            const allUploaded = eUploaded && oUploaded;
            
            return (
              <TabsContent key={month} value={month} className="p-6">
                {!allUploaded && (
                  <UploadBanner
                    title={`${month} Data Upload Required`}
                    message={`Please upload both the Employee (E) and Other Businesses (O) CSV files for ${month} to view detailed performance metrics.`}
                    buttonText=""
                    uploadType="monthly"
                    month={monthLower}
                    showEOButtons={true}
                    eUploaded={eUploaded}
                    oUploaded={oUploaded}
                  />
                )}
                
                {allUploaded && financialMetrics && (
                  <div className="space-y-6">
                    {/* Monthly Financial Snapshot */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-neutral-text text-sm font-medium">Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold numeric">
                            {formatCurrency(financialMetrics.revenue)}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-neutral-text text-sm font-medium">Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold numeric">
                            {formatCurrency(financialMetrics.expenses)}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-neutral-text text-sm font-medium">Net Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold numeric ${
                            financialMetrics.netIncome >= 0 ? 'text-positive' : 'text-negative'
                          }`}>
                            {formatCurrency(financialMetrics.netIncome)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Line Item Breakdown Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Line Item Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          {columnHeaders.length > 0 ? (
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b border-neutral-border">
                                  <th className="text-left py-3 px-4 font-medium">Line Item</th>
                                  {columnHeaders.map(header => (
                                    <th key={header} className="text-right py-3 px-4 font-medium">
                                      {header}
                                    </th>
                                  ))}
                                  <th className="text-right py-3 px-4 font-medium">All Employees</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lineItems.map((item, index) => (
                                  <React.Fragment key={`item-${item.key}-${index}`}>
                                    <tr className="border-b border-neutral-border">
                                      <td className="py-3 px-4 font-semibold">{item.name}</td>
                                      {columnHeaders.map(header => (
                                        <td key={`${item.key}-${header}`} className="text-right py-3 px-4 numeric">
                                          {item.values && typeof item.values[header] !== 'undefined'
                                            ? formatCurrency(item.values[header]) 
                                            : '$0'}
                                        </td>
                                      ))}
                                      <td className="text-right py-3 px-4 font-medium numeric">
                                        {item.values && typeof item.values['All Employees'] !== 'undefined'
                                          ? formatCurrency(item.values['All Employees']) 
                                          : '$0'}
                                      </td>
                                    </tr>
                                    {item.children && item.children.map((child, childIndex) => (
                                      <tr key={`${child.key}-${childIndex}`} className="border-b border-neutral-border bg-neutral-bg">
                                        <td className="py-3 px-4 pl-8">{child.name}</td>
                                        {columnHeaders.map(header => (
                                          <td key={`${child.key}-${header}`} className="text-right py-3 px-4 numeric">
                                            {child.values && typeof child.values[header] !== 'undefined'
                                              ? formatCurrency(child.values[header]) 
                                              : '$0'}
                                          </td>
                                        ))}
                                        <td className="text-right py-3 px-4 numeric">
                                          {child.values && typeof child.values['All Employees'] !== 'undefined'
                                            ? formatCurrency(child.values['All Employees']) 
                                            : '$0'}
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="py-8 text-center text-neutral-text">
                              <p>No detailed line item data available for this month.</p>
                              <p className="mt-2">Try uploading more detailed CSV data.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Entity-Level Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Doctor Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] flex flex-col items-center justify-center">
                            <p className="text-neutral-text">Provider performance data is available.</p>
                            <p className="mt-2">
                              <a href="/doctor-performance" className="text-primary hover:underline">
                                View detailed provider analysis
                              </a>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Department Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] flex flex-col items-center justify-center">
                            <p className="text-neutral-text">Department performance data is available.</p>
                            <p className="mt-2">
                              <a href="/department-analysis" className="text-primary hover:underline">
                                View detailed department analysis
                              </a>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>
    </div>
  );
}
