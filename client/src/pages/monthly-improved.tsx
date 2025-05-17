import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadBanner from "@/components/upload/upload-banner";
import { useStore } from "@/store/data-store";
import RecursiveLineItemTable from "@/components/monthly/recursive-line-item-table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Month names for display (capitalized)
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Mapping for month display and lookup
const monthMap = {
  january: "January",
  february: "February",
  march: "March",
  april: "April",
  may: "May",
  june: "June",
  july: "July",
  august: "August",
  september: "September",
  october: "October",
  november: "November",
  december: "December"
};

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to extract financial values from line items
function getLineItemValue(lineItems: any[], keyword: string): number {
  return lineItems?.find(i => 
    i.name.toLowerCase().includes(keyword.toLowerCase())
  )?.summaryValue || 0;
}

export default function MonthlyImproved() {
  const { uploadStatus, monthlyData } = useStore();
  const [activeMonth, setActiveMonth] = useState("January");
  const [viewType, setViewType] = useState<'e' | 'o'>('e');
  
  const monthLower = activeMonth.toLowerCase();

  // Find and extract the data for the active month
  const monthData = useMemo(() => {
    // Log available months for debugging
    const availableMonths = Object.keys(monthlyData || {});
    console.log(`Available months in data store:`, availableMonths);
    
    // Find the matching month key (accounting for case differences and variations)
    // This approach makes our app fully dynamic for any month format
    const matchingKey = availableMonths.find(key => {
      const keyLower = key.toLowerCase();
      // Try multiple matching approaches to ensure we find the right month
      return keyLower === monthLower || 
             key === activeMonth ||
             (Object.keys(monthMap).includes(keyLower) && 
              monthMap[keyLower as keyof typeof monthMap].toLowerCase() === monthLower);
    });
    
    if (!matchingKey) {
      console.log(`No data found for month: ${activeMonth}`);
      return {
        eData: { lineItems: [] },
        oData: { lineItems: [] }
      };
    }
    
    // Get the data for this month
    const monthObj = monthlyData[matchingKey];
    
    console.log(`Found monthly data for ${matchingKey}:`, monthObj);
    return {
      eData: monthObj?.e || { lineItems: [] },
      oData: monthObj?.o || { lineItems: [] }
    };
  }, [activeMonth, monthLower, monthlyData]);
  
  // Get the currently selected data type
  const selectedData = viewType === 'e' ? monthData.eData : monthData.oData;
  const lineItems = selectedData?.lineItems || [];
  
  // Extract column headers specific to the selected data type
  const columnHeaders = useMemo(() => {
    if (viewType === 'e') {
      // For employee view, only show employee columns
      return monthData.eData?.entityColumns || [];
    } else {
      // For other business view, only show other business columns
      // Filter out any employee-related columns like "All Employees"
      const oColumns = monthData.oData?.entityColumns || [];
      return oColumns.filter(col => col !== 'All Employees');
    }
  }, [monthData, viewType]);
  
  // Calculate financial metrics from the selected data
  const financialMetrics = useMemo(() => {
    if (!lineItems || lineItems.length === 0) {
      return {
        revenue: 0,
        expenses: 0,
        netIncome: 0
      };
    }
    
    const revenue = getLineItemValue(lineItems, "Total Revenue");
    const expenses = getLineItemValue(lineItems, "Total Operating Expenses");
    const netIncome = getLineItemValue(lineItems, "Net Income");
    
    return { revenue, expenses, netIncome };
  }, [lineItems]);
  
  // Check if any data is available for the current month
  const hasData = (monthData.eData?.lineItems?.length > 0 || monthData.oData?.lineItems?.length > 0);

  // Check if specific data is available for the selected view type
  const hasSelectedData = selectedData?.lineItems?.length > 0;
  
  // Check which months have data available
  const monthsWithData = useMemo(() => {
    const result = new Set<string>();
    
    // Check all months in the data store - supports any month format
    Object.keys(monthlyData || {}).forEach(month => {
      const data = monthlyData[month];
      if (data?.e?.lineItems?.length > 0 || data?.o?.lineItems?.length > 0) {
        // Try multiple matching strategies for complete flexibility
        
        // 1. Direct case-insensitive match
        const monthLower = month.toLowerCase();
        const directMatch = months.find(m => 
          m.toLowerCase() === monthLower
        );
        
        if (directMatch) {
          result.add(directMatch);
          return;
        }
        
        // 2. Month map lookup (for normalized entries like "january" → "January")
        if (Object.keys(monthMap).includes(monthLower)) {
          const mappedMonth = monthMap[monthLower as keyof typeof monthMap];
          result.add(mappedMonth);
          return;
        }
        
        // 3. Partial match (if stored as abbreviations like "Jan")
        const partialMatch = months.find(m => 
          m.toLowerCase().startsWith(monthLower) || 
          monthLower.startsWith(m.toLowerCase().substring(0, 3))
        );
        
        if (partialMatch) {
          result.add(partialMatch);
        }
      }
    });
    
    return result;
  }, [monthlyData]);
  
  // Toggle between E and O view types
  const toggleViewType = (type: 'e' | 'o') => {
    setViewType(type);
  };
  
  // Function to export month data to CSV
  const exportMonthData = (month: string) => {
    const monthLower = month.toLowerCase();
    const matchingKey = Object.keys(monthlyData || {}).find(key => {
      const keyLower = key.toLowerCase();
      return keyLower === monthLower || 
             key === month ||
             (Object.keys(monthMap).includes(keyLower) && 
              monthMap[keyLower as keyof typeof monthMap].toLowerCase() === monthLower);
    });
    
    if (!matchingKey) {
      toast({
        title: "Export Failed",
        description: `No data found for ${month}`,
        variant: "destructive"
      });
      return;
    }
    
    const monthObj = monthlyData[matchingKey];
    
    // Extract data from both E and O files
    const eData = monthObj?.e || { lineItems: [] };
    const oData = monthObj?.o || { lineItems: [] };
    
    // Get revenue, expenses, and net income from both file types
    const getMetrics = (data: any) => {
      const lineItems = data.lineItems || [];
      const revenue = getLineItemValue(lineItems, "Total Revenue");
      const expenses = getLineItemValue(lineItems, "Total Operating Expenses");
      const netIncome = getLineItemValue(lineItems, "Net Income");
      return { revenue, expenses, netIncome };
    };
    
    const eMetrics = getMetrics(eData);
    const oMetrics = getMetrics(oData);
    
    // Create CSV content
    const csvContent = [
      "Data Type,Revenue,Expenses,Net Income",
      `Employee (E-File),${eMetrics.revenue},${eMetrics.expenses},${eMetrics.netIncome}`,
      `Other Business (O-File),${oMetrics.revenue},${oMetrics.expenses},${oMetrics.netIncome}`,
      `Combined Total,${eMetrics.revenue + oMetrics.revenue},${eMetrics.expenses + oMetrics.expenses},${eMetrics.netIncome + oMetrics.netIncome}`
    ].join("\n");
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${month}_Financial_Summary.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `${month} financial data has been downloaded`,
    });
  };

  return (
    <div className="container px-4 py-6 mx-auto max-w-full">
      <h1 className="text-3xl font-bold mb-6">Monthly Financial Analysis</h1>
      
      {/* Check if there's any monthly data available */}
      {!hasData && Object.keys(monthlyData || {}).length === 0 && (
        <UploadBanner 
          title="No Monthly Data Available" 
          uploadType="monthly"
          month={activeMonth}
        />
      )}
      
      {/* Main content with tabs */}
      <Tabs value={activeMonth} onValueChange={setActiveMonth}>
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 w-full">
            {months.map((month) => {
              const hasData = monthsWithData.has(month);
              return (
                <TabsTrigger
                  key={month}
                  value={month}
                  disabled={!hasData}
                  className={hasData ? "relative text-md" : "opacity-50 text-md"}
                >
                  {month}
                  {hasData && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        
        {months.map((month) => (
          <TabsContent key={month} value={month} className="mt-0">
            {/* Data Type Selection */}
            <div className="flex gap-4 mb-6">
              <Button 
                variant={viewType === 'e' ? "default" : "outline"}
                onClick={() => toggleViewType('e')}
                className="flex-1"
              >
                Employee Expenses
                {monthData.eData?.lineItems?.length > 0 && (
                  <span className="ml-2 bg-primary-foreground text-primary px-2 py-0.5 rounded-full text-xs">
                    {monthData.eData.lineItems.length}
                  </span>
                )}
              </Button>
              
              <Button 
                variant={viewType === 'o' ? "default" : "outline"}
                onClick={() => toggleViewType('o')}
                className="flex-1"
              >
                Other Business
                {monthData.oData?.lineItems?.length > 0 && (
                  <span className="ml-2 bg-primary-foreground text-primary px-2 py-0.5 rounded-full text-xs">
                    {monthData.oData.lineItems.length}
                  </span>
                )}
              </Button>
            </div>
            
            {/* Month header and summary with export button */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold">
                  {month} 2024 - 
                  {viewType === 'e' ? ' Employee Expenses' : ' Other Business Expenses'}
                </h2>
                <p className="text-muted-foreground">
                  {hasSelectedData 
                    ? `Showing ${lineItems.length} line items` 
                    : `No data available for ${viewType === 'e' ? 'employee' : 'other business'} expenses`}
                </p>
              </div>
              
              {/* Export button */}
              {hasData && (
                <Button 
                  onClick={() => exportMonthData(month)}
                  variant="outline" 
                  className="flex items-center gap-2 self-start"
                >
                  <Download size={16} />
                  <span>Export Summary</span>
                </Button>
              )}
            </div>
            
            {/* KPI Cards - responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
              <Card className="shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <span className="bg-blue-100 p-1.5 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </span>
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl md:text-3xl font-bold text-blue-600">
                    {formatCurrency(financialMetrics.revenue)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <span className="bg-red-100 p-1.5 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </span>
                    Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl md:text-3xl font-bold text-red-600">
                    {formatCurrency(financialMetrics.expenses)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-l-4 border-green-500 sm:col-span-2 md:col-span-1 hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <span className={`${financialMetrics.netIncome < 0 ? 'bg-red-100' : 'bg-green-100'} p-1.5 rounded-full mr-2`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={financialMetrics.netIncome < 0 ? 'text-red-600' : 'text-green-600'}>
                        {financialMetrics.netIncome < 0 
                          ? <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                          : <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        }
                      </svg>
                    </span>
                    Net Income
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className={`text-2xl md:text-3xl font-bold ${financialMetrics.netIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(financialMetrics.netIncome)}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Primary data table */}
            <Card className="shadow-lg border-t-4 border-blue-500">
              <CardHeader className="bg-gray-50 px-4 py-4 sm:px-6">
                <CardTitle className="text-xl font-semibold flex items-center justify-between">
                  <span>{viewType === 'e' ? 'Employee' : 'Other Business'} Financial Details</span>
                  <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {month} 2024
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!hasSelectedData ? (
                  <div className="py-12 text-center text-muted-foreground px-4">
                    <p className="mb-4 text-lg">
                      No data available for {viewType === 'e' ? 'employee' : 'other business'} expenses in {month}.
                    </p>
                    <p className="text-md">
                      Upload a {viewType === 'e' ? 'monthly-e' : 'monthly-o'} CSV file to see detailed financial data.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[600px] md:max-h-[800px]">
                    <RecursiveLineItemTable 
                      data={lineItems} 
                      entityColumns={columnHeaders}
                      summaryColumn={selectedData?.summaryColumn}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Upload section if data is missing */}
            {!hasSelectedData && (
              <div className="mt-6">
                <Separator className="my-6" />
                <UploadBanner 
                  title={`Upload ${viewType === 'e' ? 'Employee' : 'Other Business'} Data`} 
                  uploadType="monthly"
                  month={activeMonth}
                />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}