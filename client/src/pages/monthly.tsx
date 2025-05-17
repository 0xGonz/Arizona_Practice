import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadBanner from "@/components/upload/upload-banner";
import { useStore } from "@/store/data-store";
import { parseFinancialValue } from "@/lib/csv-parser";
import HierarchicalView from "@/components/monthly/hierarchical-view";
import RecursiveLineItemTable from "@/components/monthly/recursive-line-item-table";
import RawCSVView from "@/components/monthly/raw-csv-view";

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
  const [selectedView, setSelectedView] = useState("employees"); // 'employees' or 'other'
  const [dataViewMode, setDataViewMode] = useState("processed"); // 'processed' or 'raw'
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
    // Check for both new (structured) and old format data
    const matchingMonthKey = possibleMonthKeys.find(key => {
      const monthData = monthlyData[key];
      if (!monthData) return false;
      
      // Check for new structured format first
      if (monthData.e && typeof monthData.e === 'object' && !Array.isArray(monthData.e)) {
        return true;
      }
      
      // Check for old format as fallback
      if (Array.isArray(monthData.e) && monthData.e.length > 0) return true;
      if (Array.isArray(monthData.o) && monthData.o.length > 0) return true;
      
      return false;
    });
    
    if (!matchingMonthKey) {
      console.log(`No monthly data found for: ${monthLower} (or alternative spellings)`);
      return {
        eData: [],
        oData: [],
        eNestedData: [],
        oNestedData: [],
        eMetadata: {},
        oMetadata: {},
        columnHeaders: []
      };
    }
    
    console.log(`Found monthly data using key: ${matchingMonthKey}`, monthlyData[matchingMonthKey]);
    
    // Extract data with support for both new and old formats
    let eData: any[] = [];
    let oData: any[] = [];
    let eNestedData: any[] = [];
    let oNestedData: any[] = [];
    let eMetadata: any = {};
    let oMetadata: any = {};
    
    const monthDataObj = monthlyData[matchingMonthKey];
    
    // Handle new structured format
    if (monthDataObj.e && typeof monthDataObj.e === 'object' && !Array.isArray(monthDataObj.e)) {
      // Check for new simplified format with lineItems
      if (monthDataObj.e.lineItems) {
        eData = monthDataObj.e.lineItems;
        eNestedData = monthDataObj.e.lineItems || [];
        eMetadata = {
          entityColumns: monthDataObj.e.entityColumns || [],
          summaryColumn: monthDataObj.e.summaryColumn,
          type: 'monthly-e'
        };
      } 
      // Fall back to older format if needed
      else if (monthDataObj.e.flat) {
        eData = monthDataObj.e.flat;
        eNestedData = monthDataObj.e.nested || [];
        eMetadata = monthDataObj.e.meta || {};
      } 
      else {
        eData = [];
        eNestedData = [];
        eMetadata = {}; 
      }
      console.log("Found structured eData with:", eData.length, "flat items and", eNestedData.length, "nested categories");
    } else if (Array.isArray(monthDataObj.e)) {
      // Old format (flat array)
      eData = monthDataObj.e;
      console.log("Found legacy eData with:", eData.length, "items");
    }
    
    // Same for o data
    if (monthDataObj.o && typeof monthDataObj.o === 'object' && !Array.isArray(monthDataObj.o)) {
      // Check for new simplified format with lineItems
      if (monthDataObj.o.lineItems) {
        oData = monthDataObj.o.lineItems;
        oNestedData = monthDataObj.o.lineItems || [];
        oMetadata = {
          entityColumns: monthDataObj.o.entityColumns || [],
          summaryColumn: monthDataObj.o.summaryColumn,
          type: 'monthly-o'
        };
      } 
      // Fall back to older format if needed
      else if (monthDataObj.o.flat) {
        oData = monthDataObj.o.flat;
        oNestedData = monthDataObj.o.nested || [];
        oMetadata = monthDataObj.o.meta || {};
      } 
      else {
        oData = [];
        oNestedData = [];
        oMetadata = {}; 
      }
      console.log("Found structured oData with:", oData.length, "flat items and", oNestedData.length, "nested categories");
    } else if (Array.isArray(monthDataObj.o)) {
      // Old format (flat array)
      oData = monthDataObj.o;
      console.log("Found legacy oData with:", oData.length, "items");
    }
    
    // Extract column headers from the data (prefer metadata if available)
    const columnHeaders = (() => {
      // Try to get from new format metadata first
      if (eMetadata && eMetadata.entityColumns && eMetadata.entityColumns.length) {
        return eMetadata.entityColumns;
      }
      
      if (oMetadata && oMetadata.entityColumns && oMetadata.entityColumns.length) {
        return oMetadata.entityColumns;
      }
      
      // Try to extract from flat data
      if (eData && eData.length > 0) {
        const headers = Object.keys(eData[0] || {}).filter(
          header => header !== 'Line Item' && header !== '' && 
          !header.toLowerCase().includes('all') && 
          !header.toLowerCase().includes('total')
        );
        if (headers.length > 0) return headers;
      }
      
      if (oData && oData.length > 0) {
        const headers = Object.keys(oData[0] || {}).filter(
          header => header !== 'Line Item' && header !== '' && 
          !header.toLowerCase().includes('all') && 
          !header.toLowerCase().includes('total')
        );
        if (headers.length > 0) return headers;
      }
      
      return [];
    })();
    
    console.log("Extracted column headers:", columnHeaders);
    
    return {
      eData,
      oData,
      eNestedData,
      oNestedData,
      eMetadata,
      oMetadata,
      columnHeaders
    };
  }, [activeMonth, monthlyData, monthLower]);
  
  // If no data is available, show an upload banner
  if (!monthData || 
      (!monthData.eData.length && !monthData.oData.length && 
       !monthData.eNestedData.length && !monthData.oNestedData.length)) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Monthly Financial Analysis</h1>
        
        <UploadBanner
          title="No monthly data available"
          description="Upload your monthly CSV files to see detailed financial analysis."
          uploadType="monthly"
          month={activeMonth}
        />
      </div>
    );
  }
  
  // Calculate financial metrics for display
  const financialMetrics = useMemo(() => {
    // Default empty metrics
    const defaultMetrics = {
      revenue: 0,
      expenses: 0,
      netIncome: 0
    };
    
    // Use the selected view's data
    const data = selectedView === 'employees' ? monthData.eData : monthData.oData;
    
    if (!data || data.length === 0) {
      return defaultMetrics;
    }
    
    // Define some commonly used category names
    const mainCategories = ['Revenue', 'Expenses', 'Operating Expenses', 'Net Income'];
    
    // Helper function to categorize line items
    const categorizeLineItem = (lineItem: string) => {
      const lowerLineItem = lineItem.toLowerCase();
      
      // Check for revenue categories
      if (lowerLineItem.includes('revenue') || 
          lowerLineItem.includes('income') || 
          lowerLineItem.includes('service') ||
          lowerLineItem.includes('practice') ||
          lowerLineItem.includes('professional')) {
        return mainCategories[0]; // Revenue
      }
      
      // Check for expense categories
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
    const findRow = (rows: any[], searchTerms: any[]) => {
      return rows.find(row => {
        if (!row['Line Item']) return false;
        const lineItem = row['Line Item'].toLowerCase();
        return searchTerms.some(term => lineItem.includes(term.toLowerCase()));
      });
    };
    
    // Function to safely extract a value from a row and column
    const safeExtractValue = (row: any, columnName: any) => {
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
      
      // Find relevant rows for this category
      let searchTerms = category === 'Revenue' 
        ? ['revenue', 'income', 'fee'] 
        : category === 'Expenses' || category === 'Operating Expenses'
          ? ['expense', 'operating expense', 'cost', 'payroll', 'salary']
          : ['net income', 'profit', 'operating income'];
      
      // For net income, we'll calculate it ourselves
      if (category === 'Net Income') {
        return {
          key: 'net_income',
          name: 'Net Income',
          values: {},
          children: []
        };
      }
      
      // Extract matching rows
      const matchingRows = data.filter(row => {
        if (!row['Line Item']) return false;
        const lineItem = row['Line Item'].toLowerCase();
        return searchTerms.some(term => lineItem.includes(term.toLowerCase()));
      });
      
      if (matchingRows.length === 0) {
        return {
          key: category.toLowerCase().replace(/\s+/g, '_'),
          name: category,
          values: {},
          children: []
        };
      }
      
      // Calculate values for each provider column
      const columnValues = {};
      const allEmployeeValues = {};
      
      monthData.columnHeaders.forEach(header => {
        let totalValue = 0;
        
        matchingRows.forEach(row => {
          totalValue += safeExtractValue(row, header);
        });
        
        columnValues[header] = totalValue;
      });
      
      // If we have an "All Employees" column, use that for summary
      if (data[0] && data[0]['All Employees'] !== undefined) {
        let totalValue = 0;
        
        matchingRows.forEach(row => {
          totalValue += safeExtractValue(row, 'All Employees');
        });
        
        allEmployeeValues['All Employees'] = totalValue;
      }
      
      // Create category item with calculated values
      return {
        key: category.toLowerCase().replace(/\s+/g, '_'),
        name: category,
        values: {
          ...columnValues,
          ...allEmployeeValues
        },
        children: []
      };
    });
    
    // Calculate totals
    const revenue = processedItems.find(item => item.key === 'revenue');
    const expenses = processedItems.find(item => item.key === 'expenses' || item.key === 'operating_expenses');
    
    // Calculate net income
    const netIncome = processedItems.find(item => item.key === 'net_income');
    
    if (revenue && expenses && netIncome) {
      // For each column, calculate the net income
      monthData.columnHeaders.forEach(header => {
        const revValue = revenue.values[header] || 0;
        const expValue = expenses.values[header] || 0;
        netIncome.values[header] = revValue - expValue;
      });
      
      // Calculate total net income
      if (revenue.values['All Employees'] !== undefined && expenses.values['All Employees'] !== undefined) {
        netIncome.values['All Employees'] = revenue.values['All Employees'] - expenses.values['All Employees'];
      }
    }
    
    // Extract summary values for KPI cards
    const revenueValue = revenue?.values['All Employees'] ?? 
      (revenue ? Object.values(revenue.values).reduce((sum: any, val: any) => sum + val, 0) : 0);
    
    const expensesValue = expenses?.values['All Employees'] ?? 
      (expenses ? Object.values(expenses.values).reduce((sum: any, val: any) => sum + val, 0) : 0);
    
    const netIncomeValue = netIncome?.values['All Employees'] ?? 
      (revenueValue - expensesValue);
    
    return {
      revenue: revenueValue,
      expenses: expensesValue,
      netIncome: netIncomeValue,
      lineItems: processedItems
    };
  }, [monthData, selectedView]);
  
  const lineItems = financialMetrics.lineItems || [];
  const { columnHeaders } = monthData;
  
  // Add view toggle for Employee vs Other Monthly data
  const toggleView = (view: string) => {
    setSelectedView(view);
  };
  
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Monthly Financial Analysis</h1>
      
      <Tabs defaultValue={activeMonth.toLowerCase()} onValueChange={(value) => setActiveMonth(value)}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <TabsList className="mb-4 sm:mb-0">
            {months.map((month) => {
              const lowerMonth = month.toLowerCase();
              const hasData = Object.keys(monthlyData).some(key => 
                key.toLowerCase() === lowerMonth && (
                  (monthlyData[key].e && 
                   (Array.isArray(monthlyData[key].e) ? 
                    monthlyData[key].e.length > 0 : 
                    true)) || 
                  (monthlyData[key].o && 
                   (Array.isArray(monthlyData[key].o) ? 
                    monthlyData[key].o.length > 0 : 
                    true))
                )
              );
              
              return (
                <TabsTrigger
                  key={month}
                  value={month}
                  disabled={!hasData}
                  className={hasData ? "relative" : "opacity-50"}
                >
                  {month}
                  {hasData && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          <div className="flex space-x-2">
            <button
              onClick={() => toggleView('employees')}
              className={`px-3 py-1 text-sm rounded ${
                selectedView === 'employees' ? 'bg-primary text-white' : 'bg-muted'
              }`}
            >
              Employee Data
            </button>
            <button
              onClick={() => toggleView('other')}
              className={`px-3 py-1 text-sm rounded ${
                selectedView === 'other' ? 'bg-primary text-white' : 'bg-muted'
              }`}
            >
              Other Business
            </button>
          </div>
        </div>
        
        {months.map((month) => (
          <TabsContent key={month} value={month} className="mt-0">
            <div className="space-y-6">
              {/* Monthly Financial Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialMetrics.revenue)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialMetrics.expenses)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      financialMetrics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(financialMetrics.netIncome)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Line Item Breakdown Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Line Item Breakdown (Hierarchical View)</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedView === 'employees' && monthData.eNestedData.length > 0 ? (
                    <HierarchicalView 
                      data={monthData.eNestedData} 
                      columnHeaders={columnHeaders} 
                      isNested={true}
                    />
                  ) : selectedView === 'other' && monthData.oNestedData.length > 0 ? (
                    <HierarchicalView 
                      data={monthData.oNestedData} 
                      columnHeaders={columnHeaders}
                      isNested={true}
                    />
                  ) : columnHeaders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-border">
                            <th className="text-left py-3 px-4 font-medium">Line Item</th>
                            {columnHeaders.map(header => (
                              <th key={header} className="text-right py-3 px-4 font-medium">
                                {header}
                              </th>
                            ))}
                            <th className="text-right py-3 px-4 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, index) => (
                            <React.Fragment key={`item-${item.key || index}`}>
                              <tr className="border-b border-neutral-border">
                                <td className="py-3 px-4 font-semibold">{item.name}</td>
                                {columnHeaders.map(header => (
                                  <td key={`${item.key || index}-${header}`} className="text-right py-3 px-4">
                                    {item.values && typeof item.values[header] !== 'undefined'
                                      ? formatCurrency(item.values[header]) 
                                      : '$0'}
                                  </td>
                                ))}
                                <td className="text-right py-3 px-4 font-medium">
                                  {item.values && typeof item.values['All Employees'] !== 'undefined'
                                    ? formatCurrency(item.values['All Employees']) 
                                    : item.values && typeof item.values['Total'] !== 'undefined'
                                      ? formatCurrency(item.values['Total'])
                                      : '$0'}
                                </td>
                              </tr>
                              {item.children && item.children.map((child, childIndex) => (
                                <tr key={`${child.key || childIndex}`} className="border-b border-neutral-border bg-gray-50">
                                  <td className="py-3 px-4 pl-8">{child.name}</td>
                                  {columnHeaders.map(header => (
                                    <td key={`${child.key || childIndex}-${header}`} className="text-right py-3 px-4">
                                      {child.values && typeof child.values[header] !== 'undefined'
                                        ? formatCurrency(child.values[header]) 
                                        : '$0'}
                                    </td>
                                  ))}
                                  <td className="text-right py-3 px-4">
                                    {child.values && typeof child.values['All Employees'] !== 'undefined'
                                      ? formatCurrency(child.values['All Employees']) 
                                      : child.values && typeof child.values['Total'] !== 'undefined'
                                        ? formatCurrency(child.values['Total'])
                                        : '$0'}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      No data available for this month.
                    </div>
                  )}
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
                      <p className="text-muted-foreground">Provider performance data is available.</p>
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
                    <CardTitle>Department Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex flex-col items-center justify-center">
                      <p className="text-muted-foreground">Department data is available.</p>
                      <p className="mt-2">
                        <a href="/department-analysis" className="text-primary hover:underline">
                          View department breakdown
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}