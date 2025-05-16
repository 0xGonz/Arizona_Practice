import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadBanner from "@/components/upload/upload-banner";
import { useStore } from "@/store/data-store";
import RecursiveLineItemTable from "@/components/monthly/recursive-line-item-table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    
    // Find the matching month key (accounting for case differences)
    const matchingKey = availableMonths.find(key => 
      key.toLowerCase() === monthLower || 
      key === activeMonth
    );
    
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
      return monthData.oData?.entityColumns || [];
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
    
    // Check all months in the data store
    Object.keys(monthlyData || {}).forEach(month => {
      const data = monthlyData[month];
      if (data?.e?.lineItems?.length > 0 || data?.o?.lineItems?.length > 0) {
        // Find the matching month name in proper case
        const matchingMonth = months.find(m => 
          m.toLowerCase() === month.toLowerCase()
        );
        if (matchingMonth) {
          result.add(matchingMonth);
        }
      }
    });
    
    return result;
  }, [monthlyData]);
  
  // Toggle between E and O view types
  const toggleViewType = (type: 'e' | 'o') => {
    setViewType(type);
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
            
            {/* Month header and summary */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                {month} {new Date().getFullYear()} - 
                {viewType === 'e' ? ' Employee Expenses' : ' Other Business Expenses'}
              </h2>
              <p className="text-muted-foreground">
                {hasSelectedData 
                  ? `Showing ${lineItems.length} line items` 
                  : `No data available for ${viewType === 'e' ? 'employee' : 'other business'} expenses`}
              </p>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(financialMetrics.revenue)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(financialMetrics.expenses)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Net Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(financialMetrics.netIncome)}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Primary data table */}
            <Card className="shadow-lg border-t-4 border-blue-500">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-xl font-semibold">
                  {viewType === 'e' ? 'Employee' : 'Other Business'} Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasSelectedData ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="mb-4 text-lg">
                      No data available for {viewType === 'e' ? 'employee' : 'other business'} expenses in {month}.
                    </p>
                    <p className="text-md">
                      Upload a {viewType === 'e' ? 'monthly-e' : 'monthly-o'} CSV file to see detailed financial data.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[800px]">
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