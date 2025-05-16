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

  // Extract data for the active month
  const monthData = useMemo(() => {
    // Debug the monthly data when a month is selected
    console.log(`Loading monthly data for: ${monthLower}`, monthlyData[monthLower]);
    
    if (!monthlyData[monthLower]) return null;
    
    const eData = monthlyData[monthLower]?.e || [];
    const oData = monthlyData[monthLower]?.o || [];
    
    // Log the data to help with debugging
    console.log(`Monthly data loaded:`, { 
      eData: eData?.length || 0,
      oData: oData?.length || 0
    });
    
    return { eData, oData };
  }, [monthlyData, monthLower]);

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
    
    // First try to find the "All Employees" column by exact match
    if (monthData.eData[0] && typeof monthData.eData[0]['All Employees'] !== 'undefined') {
      return 'All Employees';
    }
    
    // Then look for columns that might contain "total" or similar keywords
    const possibleTotalColumns = Object.keys(monthData.eData[0] || {}).filter(key => 
      key.toLowerCase().includes('total') ||
      key.toLowerCase().includes('all')
    );
    
    if (possibleTotalColumns.length > 0) {
      console.log("Using alternative total column:", possibleTotalColumns[0]);
      return possibleTotalColumns[0];
    }
    
    return "All Employees"; // Default fallback
  }, [monthData]);

  // Extract main line items for the table
  const lineItems = useMemo(() => {
    if (!monthData?.eData?.length) return [];
    
    // Log first few rows to understand data structure
    console.log("Sample monthly data rows:", monthData.eData.slice(0, 3));
    
    // Create a structure for our line items - these are the categories we'll display
    const mainCategories = [
      { 
        name: 'Revenue', 
        type: 'header', 
        key: 'revenue',
        searchTerms: ['revenue', 'income', 'gross'],
        children: [
          { 
            name: 'Professional Fees', 
            type: 'line', 
            key: 'prof_fees',
            searchTerms: ['professional', 'fees', 'service']
          },
          { 
            name: 'Ancillary Revenue', 
            type: 'line', 
            key: 'ancillary',
            searchTerms: ['ancillary', 'other', 'additional'] 
          }
        ]
      },
      { 
        name: 'Expenses', 
        type: 'header', 
        key: 'expenses',
        searchTerms: ['expense', 'cost', 'expenditure'],
        children: [
          { 
            name: 'Payroll', 
            type: 'line', 
            key: 'payroll',
            searchTerms: ['payroll', 'salary', 'wage', 'compensation']
          },
          { 
            name: 'Operating', 
            type: 'line', 
            key: 'operating',
            searchTerms: ['operating', 'supplies', 'material']
          },
          { 
            name: 'Admin', 
            type: 'line', 
            key: 'admin',
            searchTerms: ['admin', 'administrative', 'office']
          }
        ]
      },
      { 
        name: 'Net Income', 
        type: 'total', 
        key: 'net_income',
        searchTerms: ['net income', 'profit', 'bottom line', 'net earnings']
      }
    ];
    
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
      
      if (totalRow) {
        totalAllEmployees = safeExtractValue(totalRow, totalsColumn);
      } else if (category.type === 'header' && category.children) {
        // Calculate the total from child rows
        category.children.forEach(child => {
          const childRows = monthData.eData.filter(row => {
            if (!row['Line Item']) return false;
            const lineItem = row['Line Item'].toLowerCase();
            return child.searchTerms.some(term => lineItem.includes(term.toLowerCase()));
          });
          
          childRows.forEach(row => {
            totalAllEmployees += safeExtractValue(row, totalsColumn);
          });
        });
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
    
    // Use the calculated financial metrics for the Net Income category
    if (financialMetrics && processedItems.length > 2) {
      // Override the total row with calculated financials
      const netIncomeItem = processedItems[2];
      
      // For the All Employees column, use the calculated net income
      netIncomeItem.values['All Employees'] = financialMetrics.netIncome;
      
      // For other columns, try to calculate by taking revenue - expenses for each column
      columnHeaders.forEach(header => {
        const columnRevenue = processedItems[0].values[header] || 0;
        const columnExpenses = processedItems[1].values[header] || 0;
        netIncomeItem.values[header] = columnRevenue - columnExpenses;
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
