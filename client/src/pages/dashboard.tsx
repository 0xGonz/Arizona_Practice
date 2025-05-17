import React, { useMemo } from "react";
import { useStore } from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  TooltipProps
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
    let totalORevenue = 0;
    let totalOExpenses = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    let netIncome = 0;
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
      let monthORevenue = 0;
      let monthOExpenses = 0;
      
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
        
        monthERevenue = revenueLine?.summaryValue || 0;
        monthEExpenses = expenseLine?.summaryValue || 0;
        
        // Add to E totals
        totalERevenue += monthERevenue;
        totalEExpenses += monthEExpenses;
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
        
        monthORevenue = revenueLine?.summaryValue || 0;
        monthOExpenses = expenseLine?.summaryValue || 0;
        
        // Add to O totals
        totalORevenue += monthORevenue;
        totalOExpenses += monthOExpenses;
      }
      
      // Calculate month's combined values
      const monthRevenue = monthERevenue + monthORevenue;
      const monthExpenses = monthEExpenses + monthOExpenses;
      const monthNetIncome = monthRevenue - monthExpenses;
      
      // Add month to trends data for chart
      monthlyTrends.push({
        month: month.charAt(0).toUpperCase() + month.slice(1, 3),
        revenue: monthRevenue,
        eRevenue: monthERevenue,
        oRevenue: monthORevenue,
        expenses: monthExpenses,
        eExpenses: monthEExpenses,
        oExpenses: monthOExpenses,
        netIncome: monthNetIncome
      });
    });
    
    // Calculate combined totals
    totalRevenue = totalERevenue + totalORevenue;
    totalExpenses = totalEExpenses + totalOExpenses;
    
    // Calculate overall net income
    const eNetIncome = totalERevenue - totalEExpenses;
    const oNetIncome = totalORevenue - totalOExpenses;
    netIncome = totalRevenue - totalExpenses;
    
    return {
      totalERevenue,
      totalEExpenses,
      eNetIncome,
      totalORevenue,
      totalOExpenses,
      oNetIncome,
      totalRevenue,
      totalExpenses,
      netIncome,
      monthlyTrends
    };
  }, [monthlyData]);

  // Format the tooltip for the line chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value as number)}
            </p>
          ))}
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
                E-Files: {formatCurrency(aggregatedData.totalERevenue)}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-1"></span>
                O-Files: {formatCurrency(aggregatedData.totalORevenue)}
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
                E-Files: {formatCurrency(aggregatedData.totalEExpenses)}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-rose-400 rounded-full mr-1"></span>
                O-Files: {formatCurrency(aggregatedData.totalOExpenses)}
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
              <span className={`flex items-center ${aggregatedData.eNetIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span className={`w-2 h-2 ${aggregatedData.eNetIncome < 0 ? 'bg-red-400' : 'bg-green-400'} rounded-full mr-1`}></span>
                E-Files: {formatCurrency(aggregatedData.eNetIncome)}
              </span>
              <span className={`flex items-center ${aggregatedData.oNetIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span className={`w-2 h-2 ${aggregatedData.oNetIncome < 0 ? 'bg-red-400' : 'bg-green-400'} rounded-full mr-1`}></span>
                O-Files: {formatCurrency(aggregatedData.oNetIncome)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Trend Chart */}
      <Card className="shadow-lg border-t-4 border-blue-500 mb-6">
        <CardHeader className="bg-gray-50 px-4 py-4 sm:px-6">
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
            <span>Monthly Financial Trends</span>
            <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              All Months {new Date().getFullYear()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-80">
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
          </div>
        </CardContent>
      </Card>
      
      {/* Data Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Employee Data Card */}
        <Card className="shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gray-50 px-4 py-4 sm:px-6">
            <CardTitle className="text-lg font-semibold">
              Employee Data (E-Files)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-semibold text-blue-600">{formatCurrency(aggregatedData.totalERevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Expenses:</span>
                <span className="font-semibold text-red-600">{formatCurrency(aggregatedData.totalEExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600">Net Income:</span>
                <span className={`font-semibold ${aggregatedData.eNetIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(aggregatedData.eNetIncome)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Profit Margin:</span>
                  <span className={`font-semibold ${aggregatedData.eNetIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {aggregatedData.totalERevenue === 0 ? '0.0%' : 
                      ((aggregatedData.eNetIncome / aggregatedData.totalERevenue) * 100).toFixed(1) + '%'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Other Business Data Card */}
        <Card className="shadow-lg border-l-4 border-indigo-500 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gray-50 px-4 py-4 sm:px-6">
            <CardTitle className="text-lg font-semibold">
              Other Business Data (O-Files)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-semibold text-blue-600">{formatCurrency(aggregatedData.totalORevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Expenses:</span>
                <span className="font-semibold text-red-600">{formatCurrency(aggregatedData.totalOExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600">Net Income:</span>
                <span className={`font-semibold ${aggregatedData.oNetIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(aggregatedData.oNetIncome)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Profit Margin:</span>
                  <span className={`font-semibold ${aggregatedData.oNetIncome < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {aggregatedData.totalORevenue === 0 ? '0.0%' : 
                      ((aggregatedData.oNetIncome / aggregatedData.totalORevenue) * 100).toFixed(1) + '%'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}