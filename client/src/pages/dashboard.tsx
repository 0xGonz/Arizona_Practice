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
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
      
      {/* Combined KPI Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
        {/* Combined Revenue Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 flex items-center text-lg">
              <DollarSignIcon className="w-5 h-5 mr-2 text-blue-600" />
              Total Revenue
            </CardTitle>
            <CardDescription>All months, combined businesses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              {formatCurrency(aggregatedData.totalRevenue)}
            </div>
            <div className="mt-1 text-sm text-blue-600 flex flex-col">
              <span>
                <ArrowUpIcon className="inline h-4 w-4 mr-1" />
                E-Files: {formatCurrency(aggregatedData.totalERevenue)}
              </span>
              <span>
                <ArrowUpIcon className="inline h-4 w-4 mr-1" />
                O-Files: {formatCurrency(aggregatedData.totalORevenue)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Combined Expenses Card */}
        <Card className="bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 flex items-center text-lg">
              <DollarSignIcon className="w-5 h-5 mr-2 text-red-600" />
              Total Expenses
            </CardTitle>
            <CardDescription>All months, combined businesses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800">
              {formatCurrency(aggregatedData.totalExpenses)}
            </div>
            <div className="mt-1 text-sm text-red-600 flex flex-col">
              <span>
                <ArrowUpIcon className="inline h-4 w-4 mr-1" />
                E-Files: {formatCurrency(aggregatedData.totalEExpenses)}
              </span>
              <span>
                <ArrowUpIcon className="inline h-4 w-4 mr-1" />
                O-Files: {formatCurrency(aggregatedData.totalOExpenses)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Combined Net Income Card */}
        <Card className={`bg-gradient-to-br ${aggregatedData.netIncome >= 0 ? 'from-green-50 to-white' : 'from-amber-50 to-white'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`${aggregatedData.netIncome >= 0 ? 'text-green-800' : 'text-amber-800'} flex items-center text-lg`}>
              <DollarSignIcon className={`w-5 h-5 mr-2 ${aggregatedData.netIncome >= 0 ? 'text-green-600' : 'text-amber-600'}`} />
              Net Income
            </CardTitle>
            <CardDescription>Total profit/loss</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${aggregatedData.netIncome >= 0 ? 'text-green-800' : 'text-amber-800'}`}>
              {formatCurrency(aggregatedData.netIncome)}
            </div>
            <div className={`mt-1 text-sm flex flex-col`}>
              <span className={aggregatedData.eNetIncome >= 0 ? 'text-green-600' : 'text-amber-600'}>
                {aggregatedData.eNetIncome >= 0 ? (
                  <ArrowUpIcon className="inline h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="inline h-4 w-4 mr-1" />
                )}
                E-Files: {formatCurrency(aggregatedData.eNetIncome)}
              </span>
              <span className={aggregatedData.oNetIncome >= 0 ? 'text-green-600' : 'text-amber-600'}>
                {aggregatedData.oNetIncome >= 0 ? (
                  <ArrowUpIcon className="inline h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="inline h-4 w-4 mr-1" />
                )}
                O-Files: {formatCurrency(aggregatedData.oNetIncome)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Trend Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Financial Trends</CardTitle>
          <CardDescription>Revenue, expenses, and net income by month</CardDescription>
        </CardHeader>
        <CardContent>
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
    </div>
  );
}