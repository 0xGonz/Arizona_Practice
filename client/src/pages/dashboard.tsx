import React, { useMemo } from "react";
import { useStore } from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  TooltipProps, BarChart, Bar
} from "recharts";
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from "lucide-react";

// Format large numbers with commas and dollar sign
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function Dashboard() {
  const { monthlyData } = useStore();

  // Aggregate monthly data across all months and both data types (employee and business)
  const aggregatedData = useMemo(() => {
    // Initialize counters
    let totalERevenue = 0;
    let totalEExpenses = 0;
    let totalENetIncome = 0;
    let totalORevenue = 0;
    let totalOExpenses = 0;
    let totalONetIncome = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalNetIncome = 0;
    const monthlyTrends: any[] = [];
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const monthOrder = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
      };
      return (monthOrder[a.toLowerCase()] || 0) - (monthOrder[b.toLowerCase()] || 0);
    });

    // Process each month's data
    sortedMonths.forEach(month => {
      const monthData = monthlyData[month];
      let monthERevenue = 0;
      let monthEExpenses = 0;
      let monthENetIncome = 0;
      let monthORevenue = 0;
      let monthOExpenses = 0;
      let monthONetIncome = 0;
      let monthPayrollExpenses = 0;
      
      // Process employee (E) data if available
      if (monthData?.e?.lineItems) {
        // Look for Revenue line items - prefer Total Revenue if available
        const revenueLine = monthData.e.lineItems.find(item => 
          item.name === "Total Revenue" && item.isTotal
        ) || monthData.e.lineItems.find(item => 
          item.name === "Revenue" && item.depth === 1
        );
        
        // Look for Expense line items - prefer Total Operating Expenses if available
        const expenseLine = monthData.e.lineItems.find(item => 
          item.name === "Total Operating Expenses" && item.isTotal
        ) || monthData.e.lineItems.find(item => 
          item.name === "Operating Expense" && item.depth === 1
        );
        
        // Look for Net Income line directly from the CSV
        const netIncomeLine = monthData.e.lineItems.find(item => 
          (item.name === "Net Income (Loss)" || item.name === "Net Income") && 
          (item.isTotal || item.depth === 1)
        );
        
        // Look for Payroll and Related Expenses - try to find the exact Total line first
        const payrollExpenseLine = monthData.e.lineItems.find(item => 
          item.name === "Total Payroll and Related Expense" ||
          (item.name.includes("Payroll and Related Expense") && item.isTotal)
        ) || monthData.e.lineItems.find(item => 
          item.name.includes("Payroll and Related Expense")
        );
        
        if (payrollExpenseLine) {
          // Extract value, payroll expenses are typically negative so we use absolute value for display
          monthPayrollExpenses += Math.abs(payrollExpenseLine.summaryValue || 0);
          console.log(`Found E Payroll expense in ${month}: ${Math.abs(payrollExpenseLine.summaryValue || 0)}`);
        }
        
        monthERevenue = revenueLine?.summaryValue || 0;
        monthEExpenses = expenseLine?.summaryValue || 0;
        monthENetIncome = netIncomeLine?.summaryValue || 0;
        
        // If no Net Income line was found, don't try to calculate it
        console.log(`Found Net Income for E data in ${month}: ${monthENetIncome}`);
        
        // Add to E totals
        totalERevenue += monthERevenue;
        totalEExpenses += monthEExpenses;
        totalENetIncome += monthENetIncome;
      }
      
      // Process business (O) data if available
      if (monthData?.o?.lineItems) {
        // Look for Revenue line items - prefer Total Revenue if available
        const revenueLine = monthData.o.lineItems.find(item => 
          item.name === "Total Revenue" && item.isTotal
        ) || monthData.o.lineItems.find(item => 
          item.name === "Revenue" && item.depth === 1
        );
        
        // Look for Expense line items - prefer Total Operating Expenses if available
        const expenseLine = monthData.o.lineItems.find(item => 
          item.name === "Total Operating Expenses" && item.isTotal
        ) || monthData.o.lineItems.find(item => 
          item.name === "Operating Expense" && item.depth === 1
        );
        
        // Look for Net Income line directly from the CSV
        const netIncomeLine = monthData.o.lineItems.find(item => 
          (item.name === "Net Income (Loss)" || item.name === "Net Income") && 
          (item.isTotal || item.depth === 1)
        );
        
        // Look for Payroll and Related Expenses - try to find the exact Total line first
        const payrollExpenseLine = monthData.o.lineItems.find(item => 
          item.name === "Total Payroll and Related Expense" ||
          (item.name.includes("Payroll and Related Expense") && item.isTotal)
        ) || monthData.o.lineItems.find(item => 
          item.name.includes("Payroll and Related Expense")
        );
        
        if (payrollExpenseLine) {
          // Extract value, payroll expenses are typically negative so we use absolute value for display
          monthPayrollExpenses += Math.abs(payrollExpenseLine.summaryValue || 0);
          console.log(`Found O Payroll expense in ${month}: ${Math.abs(payrollExpenseLine.summaryValue || 0)}`);
        }
        
        monthORevenue = revenueLine?.summaryValue || 0;
        monthOExpenses = expenseLine?.summaryValue || 0;
        monthONetIncome = netIncomeLine?.summaryValue || 0;
        
        // If no Net Income line was found, don't try to calculate it
        console.log(`Found Net Income for O data in ${month}: ${monthONetIncome}`);
        
        // Add to O totals
        totalORevenue += monthORevenue;
        totalOExpenses += monthOExpenses;
        totalONetIncome += monthONetIncome;
      }
      
      // Calculate month's combined values from the direct line item values
      const monthRevenue = monthERevenue + monthORevenue;
      const monthExpenses = monthEExpenses + monthOExpenses;
      const monthNetIncome = monthENetIncome + monthONetIncome;
      
      // Create proper month abbreviations for the chart
      const monthAbbreviations = {
        january: 'Jan', february: 'Feb', march: 'Mar',
        april: 'Apr', may: 'May', june: 'Jun',
        july: 'Jul', august: 'Aug', september: 'Sep',
        october: 'Oct', november: 'Nov', december: 'Dec'
      };
      
      // Add month to trends data for chart with correct abbreviation
      // Debug logs to track where values come from
      console.log(`Month: ${month} - Revenue: ${monthRevenue}, Expenses: ${monthExpenses}, NetIncome: ${monthNetIncome}`);
      
      // IMPORTANT: Extract values directly from line items that match EXACTLY what appears on the monthly KPI cards
      // First, find the explicit Total Revenue, Total Operating Expenses, and Net Income lines
      const totalRevenueItem = monthData?.e?.lineItems?.find(item => 
        item.name === "Total Revenue" && item.isTotal
      ) || monthData?.e?.lineItems?.find(item => 
        item.name === "Total Revenue" || (item.name === "Revenue" && (item.isTotal || item.depth === 1))
      );
      
      const totalExpensesItem = monthData?.e?.lineItems?.find(item => 
        item.name === "Total Operating Expenses" && item.isTotal
      ) || monthData?.e?.lineItems?.find(item => 
        item.name === "Total Operating Expenses" || (item.name.includes("Operating Expense") && (item.isTotal || item.depth === 1))
      );
      
      const netIncomeItem = monthData?.e?.lineItems?.find(item => 
        (item.name === "Net Income (Loss)" || item.name === "Net Income") && item.isTotal
      ) || monthData?.e?.lineItems?.find(item => 
        item.name === "Net Income (Loss)" || item.name === "Net Income" 
      );
      
      // Get the exact values that appear on the KPI cards
      const kpiRevenue = totalRevenueItem ? Math.abs(totalRevenueItem.summaryValue || 0) : 0; 
      const kpiExpenses = totalExpensesItem ? Math.abs(totalExpensesItem.summaryValue || 0) : 0;
      const kpiNetIncome = netIncomeItem ? netIncomeItem.summaryValue || 0 : 0;
      
      // Ensure expenses are always positive for display purposes
      const displayExpenses = monthExpenses < 0 ? Math.abs(monthExpenses) : monthExpenses;
      const displayEExpenses = monthEExpenses < 0 ? Math.abs(monthEExpenses) : monthEExpenses;
      const displayOExpenses = monthOExpenses < 0 ? Math.abs(monthOExpenses) : monthOExpenses;
      
      // Calculate properly combined values for E+O data (actual sum of both)
      // For E-files: use the actual monthly-e file data
      const eRevenue = monthERevenue;
      const eExpenses = Math.abs(monthEExpenses); // Make expenses positive
      const eNetIncome = monthENetIncome;
      
      // For O-files: use the actual monthly-o file data
      const oRevenue = monthORevenue;
      const oExpenses = Math.abs(monthOExpenses); // Make expenses positive
      const oNetIncome = monthONetIncome;
      
      // Properly aggregated combined values (actual sum of E+O)
      const combinedRevenue = eRevenue + oRevenue;
      const combinedExpenses = eExpenses + oExpenses;
      const combinedNetIncome = eNetIncome + oNetIncome;

      // Add month to trends data for chart with correct abbreviation
      monthlyTrends.push({
        // Use standard month abbreviations with proper capitalization 
        month: monthAbbreviations[month.toLowerCase()] || month.charAt(0).toUpperCase() + month.slice(1, 3),
        
        // Combined E+O values for the first tab (properly aggregated)
        revenue: Math.round(combinedRevenue / 1000),
        expenses: Math.round(combinedExpenses / 1000),
        netIncome: Math.round(combinedNetIncome / 1000),
        
        // E file data for second tab
        eRevenue: Math.round(eRevenue / 1000),
        eExpenses: Math.round(eExpenses / 1000),
        eNetIncome: Math.round(eNetIncome / 1000),
        
        // O file data for third tab
        oRevenue: Math.round(oRevenue / 1000),
        oExpenses: Math.round(oExpenses / 1000),
        oNetIncome: Math.round(oNetIncome / 1000),
        
        // Payroll data for other charts
        payrollExpenses: Math.round(monthPayrollExpenses / 1000),
        
        // Raw values for tooltips (using actual aggregated values)
        rawRevenue: combinedRevenue,
        rawExpenses: combinedExpenses,
        rawNetIncome: combinedNetIncome,
        
        // Raw E and O values for tooltips
        rawERevenue: eRevenue,
        rawEExpenses: eExpenses,
        rawENetIncome: eNetIncome,
        rawORevenue: oRevenue,
        rawOExpenses: oExpenses,
        rawONetIncome: oNetIncome
      });
    });
    
    // Calculate combined totals
    totalRevenue = totalERevenue + totalORevenue;
    totalExpenses = totalEExpenses + totalOExpenses;
    totalNetIncome = totalENetIncome + totalONetIncome;
    
    // Initialize quarterly revenue tracking
    const quarterlyRevenue = {
      q1: 0, // Jan-Mar
      q2: 0, // Apr-Jun
      q3: 0, // Jul-Sep
      q4: 0  // Oct-Dec
    };
    
    // Track best and worst performing months
    let bestMonth: any = null;
    let worstMonth: any = null;
    let highestExpenseMonth: any = null;
    let totalMonthsWithData = 0;
    let sumMonthlyExpenses = 0;
    
    // Process monthly data again for additional metrics
    monthlyTrends.forEach(monthData => {
      const monthName = monthData.month.toLowerCase();
      
      // Update best/worst month tracking
      if (bestMonth === null || monthData.netIncome > bestMonth.netIncome) {
        bestMonth = {
          month: monthData.month,
          netIncome: monthData.netIncome,
          revenue: monthData.revenue,
          expenses: monthData.expenses
        };
      }
      
      if (worstMonth === null || monthData.netIncome < worstMonth.netIncome) {
        worstMonth = {
          month: monthData.month,
          netIncome: monthData.netIncome,
          revenue: monthData.revenue,
          expenses: monthData.expenses
        };
      }
      
      // Track highest expense month
      if (highestExpenseMonth === null || monthData.expenses > highestExpenseMonth.expenses) {
        highestExpenseMonth = {
          month: monthData.month,
          expenses: monthData.expenses
        };
      }
      
      // Add to average expense calculation
      if (monthData.expenses > 0) {
        totalMonthsWithData++;
        sumMonthlyExpenses += monthData.expenses;
      }
      
      // Add to quarterly data
      // Convert abbreviated month names to full names for mapping
      const fullMonthMap: {[key: string]: string} = {
        'Jan': 'january', 'Feb': 'february', 'Mar': 'march',
        'Apr': 'april', 'May': 'may', 'Jun': 'june',
        'Jul': 'july', 'Aug': 'august', 'Sep': 'september',
        'Oct': 'october', 'Nov': 'november', 'Dec': 'december'
      };
      
      const fullMonth = fullMonthMap[monthData.month] || '';
      
      if (['january', 'february', 'march'].includes(fullMonth)) {
        quarterlyRevenue.q1 += monthData.revenue;
      } else if (['april', 'may', 'june'].includes(fullMonth)) {
        quarterlyRevenue.q2 += monthData.revenue;
      } else if (['july', 'august', 'september'].includes(fullMonth)) {
        quarterlyRevenue.q3 += monthData.revenue;
      } else if (['october', 'november', 'december'].includes(fullMonth)) {
        quarterlyRevenue.q4 += monthData.revenue;
      }
    });
    
    // Calculate average monthly expenses
    const averageMonthlyExpenses = totalMonthsWithData > 0 ? sumMonthlyExpenses / totalMonthsWithData : 0;
    
    // Total net income is sum of all monthly net incomes (not calculated from revenue - expenses)
    totalNetIncome = totalENetIncome + totalONetIncome;
    
    return {
      // Monthly trend data for charts
      monthlyTrends,
      
      // Quarterly data
      quarterlyRevenue,
      
      // Best and worst month metrics
      bestMonth,
      worstMonth,
      highestExpenseMonth,
      averageMonthlyExpenses,
      
      // Yearly employee data
      eData: {
        revenue: totalERevenue,
        expenses: totalEExpenses,
        netIncome: totalENetIncome
      },
      
      // Yearly business data
      oData: {
        revenue: totalORevenue,
        expenses: totalOExpenses,
        netIncome: totalONetIncome
      },
      
      // Yearly totals (both combined)
      totalRevenue,
      totalExpenses,
      netIncome: totalNetIncome,
      
      // Avg profit margin (if revenue > 0)
      profitMargin: totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0
    };
  }, [monthlyData]);

  // Format the tooltip for the line chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-bold">{label}</p>
          {payload.map((entry, index) => {
            // Check if we have raw values for better tooltip display
            let displayValue = entry.value as number;
            
            // Use raw values if available (multiply displayed value by 1000 to get back original)
            if (entry.name === "Revenue" && payload[0].payload.rawRevenue) {
              displayValue = payload[0].payload.rawRevenue;
            }
            else if (entry.name === "Expenses" && payload[0].payload.rawExpenses) {
              displayValue = payload[0].payload.rawExpenses;
            }
            else if (entry.name === "Net Income" && payload[0].payload.rawNetIncome) {
              displayValue = payload[0].payload.rawNetIncome;
            }
            else {
              // If raw values aren't available, convert chart value back to original
              displayValue = (entry.value as number) * 1000;
            }
            
            return (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {formatCurrency(displayValue)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container px-4 py-6 mx-auto max-w-full">
      <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>
      
      {/* Combined KPI Cards - match monthly analysis design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Revenue Card */}
        <Card className="shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <span className="bg-blue-100 p-1.5 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              {formatCurrency(aggregatedData.totalRevenue)}
            </div>
            <div className="text-sm text-gray-600 flex flex-col mt-2">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                E-Files: {formatCurrency(aggregatedData.eData.revenue)}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-1"></span>
                O-Files: {formatCurrency(aggregatedData.oData.revenue)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Expenses Card */}
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
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl md:text-3xl font-bold text-red-600">
              {formatCurrency(aggregatedData.totalExpenses)}
            </div>
            <div className="text-sm text-gray-600 flex flex-col mt-2">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                E-Files: {formatCurrency(aggregatedData.eData.expenses)}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-rose-400 rounded-full mr-1"></span>
                O-Files: {formatCurrency(aggregatedData.oData.expenses)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Net Income Card */}
        <Card className="shadow-lg border-l-4 border-green-500 sm:col-span-2 md:col-span-1 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <span className={`${aggregatedData.netIncome < 0 ? 'bg-red-100' : 'bg-green-100'} p-1.5 rounded-full mr-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={aggregatedData.netIncome < 0 ? 'text-red-600' : 'text-green-600'}>
                  {aggregatedData.netIncome < 0 
                    ? <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    : <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  }
                </svg>
              </span>
              Net Income
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-2xl md:text-3xl font-bold ${aggregatedData.netIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(aggregatedData.netIncome)}
            </div>
            <div className="text-sm text-gray-600 flex flex-col mt-2">
              <span className={`flex items-center ${aggregatedData.eData.netIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span className={`w-2 h-2 ${aggregatedData.eData.netIncome < 0 ? 'bg-red-400' : 'bg-green-400'} rounded-full mr-1`}></span>
                E-Files: {formatCurrency(aggregatedData.eData.netIncome)}
              </span>
              <span className={`flex items-center ${aggregatedData.oData.netIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span className={`w-2 h-2 ${aggregatedData.oData.netIncome < 0 ? 'bg-red-400' : 'bg-green-400'} rounded-full mr-1`}></span>
                O-Files: {formatCurrency(aggregatedData.oData.netIncome)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Financial Trends */}
      <Card className="shadow-lg border-t-4 border-blue-500 mb-6">
        <CardHeader className="bg-gray-50 px-4 py-4 sm:px-6">
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
            <span>Monthly Financial Trends</span>
            <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              All Months 2024
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="combined">
            <TabsList className="mb-4 w-full grid grid-cols-3">
              <TabsTrigger value="combined">Total</TabsTrigger>
              <TabsTrigger value="e-files">Employee Files (E)</TabsTrigger>
              <TabsTrigger value="o-files">Business Files (O)</TabsTrigger>
            </TabsList>
            
            {/* Combined E+O Data Tab */}
            <TabsContent value="combined" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={aggregatedData.monthlyTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    name="Expenses"
                    stroke="#ef4444" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netIncome" 
                    name="Net Income"
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            {/* Employee (E) Data Tab */}
            <TabsContent value="e-files" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={aggregatedData.monthlyTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`} />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (name === "Revenue (E)") {
                        return [formatCurrency(props.payload.rawERevenue), "Revenue"];
                      } else if (name === "Expenses (E)") {
                        return [formatCurrency(props.payload.rawEExpenses), "Expenses"];
                      } else if (name === "Net Income (E)") {
                        return [formatCurrency(props.payload.rawENetIncome), "Net Income"];
                      }
                      return [formatCurrency(value as number), ""];
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="eRevenue" 
                    name="Revenue (E)"
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="eExpenses" 
                    name="Expenses (E)"
                    stroke="#ef4444" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="eNetIncome" 
                    name="Net Income (E)"
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            {/* Business (O) Data Tab */}
            <TabsContent value="o-files" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={aggregatedData.monthlyTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`} />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (name === "Revenue (O)") {
                        return [formatCurrency(props.payload.rawORevenue), "Revenue"];
                      } else if (name === "Expenses (O)") {
                        return [formatCurrency(props.payload.rawOExpenses), "Expenses"];
                      } else if (name === "Net Income (O)") {
                        return [formatCurrency(props.payload.rawONetIncome), "Net Income"];
                      }
                      return [formatCurrency(value as number), ""];
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="oRevenue" 
                    name="Revenue (O)"
                    stroke="#6366f1" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="oExpenses" 
                    name="Expenses (O)"
                    stroke="#f43f5e" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="oNetIncome" 
                    name="Net Income (O)"
                    stroke="#059669" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Financial Performance Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Employee vs Business Net Income Comparison */}
        <Card className="shadow-md border-t-4 border-blue-400">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-lg font-semibold">Employee vs Business Net Income</CardTitle>
            <CardDescription>Comparing employee and business monthly performance</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggregatedData.monthlyTrends.map(trend => ({
                    month: trend.month,
                    "eData.netIncome": trend.eNetIncome * 1000, // Convert back to real values
                    "oData.netIncome": trend.oNetIncome * 1000, // Convert back to real values
                    rawENetIncome: trend.eNetIncome * 1000, // Store raw values for tooltip
                    rawONetIncome: trend.oNetIncome * 1000  // Store raw values for tooltip
                  }))}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => 
                      `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`
                    } 
                  />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      // Use the actual value for tooltip display
                      if (name === "eData.netIncome") {
                        return [formatCurrency(props.payload.rawENetIncome), "Employee Net Income"];
                      } else if (name === "oData.netIncome") {
                        return [formatCurrency(props.payload.rawONetIncome), "Business Net Income"];
                      }
                      return [formatCurrency(value as number), ""];
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="eData.netIncome" 
                    name="Employee Net Income" 
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="oData.netIncome" 
                    name="Business Net Income" 
                    fill="#82ca9d"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin Analysis */}
        <Card className="shadow-md border-t-4 border-green-400">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-lg font-semibold">Profit Margin Analysis</CardTitle>
            <CardDescription>Monthly profit margin percentage by data source</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={aggregatedData.monthlyTrends.map(month => ({
                    month: month.month,
                    // Calculate E file margin 
                    eMargin: month.eRevenue > 0 ? (month.eNetIncome / month.eRevenue) * 100 : 0,
                    // Calculate O file margin
                    oMargin: month.oRevenue > 0 ? (month.oNetIncome / month.oRevenue) * 100 : 0,
                    // Calculate average margin
                    avgMargin: ((month.eRevenue > 0 ? (month.eNetIncome / month.eRevenue) * 100 : 0) + 
                               (month.oRevenue > 0 ? (month.oNetIncome / month.oRevenue) * 100 : 0)) / 2
                  }))}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value, name) => {
                      const formattedValue = `${(value as number).toFixed(2)}%`;
                      if (name === "eMargin") return [formattedValue, "Employee Margin (E)"];
                      if (name === "oMargin") return [formattedValue, "Business Margin (O)"];
                      if (name === "avgMargin") return [formattedValue, "Average Margin"];
                      return [formattedValue, name];
                    }} 
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="eMargin" 
                    name="Employee (E)"
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="oMargin" 
                    name="Business (O)"
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={{ fill: '#82ca9d', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgMargin" 
                    name="Average"
                    stroke="#ffc658" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#ffc658', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Payroll vs Revenue Comparison */}
      <Card className="shadow-lg border-t-4 border-blue-500 mb-6">
        <CardHeader className="bg-gray-50 px-4 py-4 sm:px-6">
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
            <span>Monthly Payroll vs Revenue</span>
            <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              All Months 2024
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aggregatedData.monthlyTrends.map(trend => ({
                  month: trend.month,
                  payroll: trend.payrollExpenses * 1000, // Convert back to real values
                  revenue: trend.revenue * 1000, // Convert back to real values
                  rawPayroll: trend.payrollExpenses * 1000, // Store raw values for tooltip
                  rawRevenue: trend.revenue * 1000 // Store raw values for tooltip
                }))}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => 
                    `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`
                  } 
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    // Use the actual values for tooltip display
                    if (name === "payroll") {
                      return [formatCurrency(props.payload.rawPayroll), 'Payroll & Related Expenses'];
                    } else if (name === "revenue") {
                      return [formatCurrency(props.payload.rawRevenue), 'Revenue'];
                    }
                    return [formatCurrency(value as number), ''];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#2563eb" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="payroll" 
                  name="Payroll & Related Expenses" 
                  fill="#f97316" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      

    </div>
  );
}