import { useState, useMemo } from "react";
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
    if (!monthlyData[monthLower]) return null;
    
    const eData = monthlyData[monthLower]?.e || [];
    const oData = monthlyData[monthLower]?.o || [];
    
    return { eData, oData };
  }, [monthlyData, monthLower]);

  // Calculate financial metrics from the montly data
  const financialMetrics = useMemo(() => {
    if (!monthData) return null;
    
    const { eData } = monthData;
    
    // Find revenue line item
    const revenueRow = eData.find(row => 
      row['Line Item'] && row['Line Item'].includes('Total Revenue')
    );
    
    // Find expense line item
    const expenseRow = eData.find(row => 
      row['Line Item'] && (
        row['Line Item'].includes('Total Expense') || 
        row['Line Item'].includes('Total Operating Expenses')
      )
    );
    
    // Calculate totals from the "All Employees" column
    const revenue = revenueRow && revenueRow['All Employees'] 
      ? parseFinancialValue(revenueRow['All Employees']) 
      : 0;
      
    const expenses = expenseRow && expenseRow['All Employees'] 
      ? parseFinancialValue(expenseRow['All Employees']) 
      : 0;
      
    const netIncome = revenue - expenses;
    
    return { revenue, expenses, netIncome };
  }, [monthData]);

  // Extract column headers (doctor/provider names) from the data
  const columnHeaders = useMemo(() => {
    if (!monthData?.eData?.length) return [];
    
    // Get all column headers except 'Line Item' and 'All Employees'
    const headers = Object.keys(monthData.eData[0] || {})
      .filter(key => key !== 'Line Item' && key !== 'All Employees');
      
    return headers;
  }, [monthData]);

  // Extract main line items for the table
  const lineItems = useMemo(() => {
    if (!monthData?.eData?.length) return [];
    
    const items = [
      { 
        name: 'Revenue', 
        type: 'header', 
        key: 'revenue',
        children: [
          { name: 'Professional Fees', type: 'line', key: 'prof_fees' },
          { name: 'Ancillary Revenue', type: 'line', key: 'ancillary' }
        ]
      },
      { 
        name: 'Expenses', 
        type: 'header', 
        key: 'expenses',
        children: [
          { name: 'Payroll', type: 'line', key: 'payroll' },
          { name: 'Operating', type: 'line', key: 'operating' },
          { name: 'Admin', type: 'line', key: 'admin' }
        ]
      },
      { name: 'Net Income', type: 'total', key: 'net_income' }
    ];
    
    // Gather actual line items from the data
    const dataItems = monthData.eData.filter(row => 
      row['Line Item'] && (
        row['Line Item'].includes('Revenue') ||
        row['Line Item'].includes('Expense') ||
        row['Line Item'].includes('Income') ||
        row['Line Item'].includes('Payroll') ||
        row['Line Item'].includes('Admin') ||
        row['Line Item'].includes('Operating')
      )
    );
    
    // Map line items to their values
    const mappedItems = items.map(item => {
      // Find matching row for this header
      const mainRow = dataItems.find(row => 
        row['Line Item'] && row['Line Item'].includes(item.name)
      );
      
      const values = {};
      
      // Get values for each column
      if (mainRow) {
        // Add values for each provider column
        columnHeaders.forEach(header => {
          values[header] = mainRow[header] ? parseFinancialValue(mainRow[header]) : 0;
        });
        
        // Add the "All Employees" value
        values['All Employees'] = mainRow['All Employees'] 
          ? parseFinancialValue(mainRow['All Employees']) 
          : 0;
      }
      
      // Process child items
      if (item.children) {
        const mappedChildren = item.children.map(child => {
          const childRow = dataItems.find(row => 
            row['Line Item'] && row['Line Item'].includes(child.name)
          );
          
          const childValues = {};
          
          if (childRow) {
            columnHeaders.forEach(header => {
              childValues[header] = childRow[header] ? parseFinancialValue(childRow[header]) : 0;
            });
            
            childValues['All Employees'] = childRow['All Employees'] 
              ? parseFinancialValue(childRow['All Employees']) 
              : 0;
          }
          
          return { ...child, values: childValues };
        });
        
        return { ...item, values, children: mappedChildren };
      }
      
      return { ...item, values };
    });
    
    return mappedItems;
  }, [monthData, columnHeaders]);

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
                                  <>
                                    <tr key={item.key} className="border-b border-neutral-border">
                                      <td className="py-3 px-4 font-semibold">{item.name}</td>
                                      {columnHeaders.map(header => (
                                        <td key={`${item.key}-${header}`} className="text-right py-3 px-4 numeric">
                                          {item.values && item.values[header] 
                                            ? formatCurrency(item.values[header]) 
                                            : '$0'}
                                        </td>
                                      ))}
                                      <td className="text-right py-3 px-4 font-medium numeric">
                                        {item.values && item.values['All Employees'] 
                                          ? formatCurrency(item.values['All Employees']) 
                                          : '$0'}
                                      </td>
                                    </tr>
                                    {item.children && item.children.map(child => (
                                      <tr key={child.key} className="border-b border-neutral-border bg-neutral-bg">
                                        <td className="py-3 px-4 pl-8">{child.name}</td>
                                        {columnHeaders.map(header => (
                                          <td key={`${child.key}-${header}`} className="text-right py-3 px-4 numeric">
                                            {child.values && child.values[header] 
                                              ? formatCurrency(child.values[header]) 
                                              : '$0'}
                                          </td>
                                        ))}
                                        <td className="text-right py-3 px-4 numeric">
                                          {child.values && child.values['All Employees'] 
                                            ? formatCurrency(child.values['All Employees']) 
                                            : '$0'}
                                        </td>
                                      </tr>
                                    ))}
                                  </>
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
