import React, { useMemo } from "react";
import { useStore } from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

// Format large numbers with commas and dollar sign
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const DeepAnalysis = () => {
  const { 
    monthlyData,
    getProviderRevenue,
    getProviderPayroll,
    getProviderNetIncome,
    getAvailableMonths
  } = useStore();
  
  const availableMonths = useMemo(() => getAvailableMonths(), [getAvailableMonths]);

  // Extract provider data from both E and O files
  const providerData = useMemo(() => {
    const result: any[] = [];
    
    // Process each month's data
    availableMonths.forEach(month => {
      const monthData = monthlyData[month.toLowerCase()];
      if (!monthData) return;
      
      // Get provider data from E files
      if (monthData.e) {
        const providers: string[] = monthData.e.entityColumns || [];
        
        providers.forEach(provider => {
          // Skip non-provider columns like "Total"
          if (provider === "Total" || provider === "All Employees") return;
          
          // Find revenue for this provider
          const revenue = getProviderRevenue(month, provider, 'e');
          const expenses = getProviderPayroll(month, provider, 'e');
          const netIncome = getProviderNetIncome(month, provider, 'e');
          
          // Add to result if we have data
          if (revenue !== 0 || expenses !== 0) {
            result.push({
              provider,
              month,
              fileType: 'Employee (E)',
              revenue,
              expenses,
              netIncome,
              profitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0
            });
          }
        });
      }
      
      // Get provider data from O files
      if (monthData.o) {
        const providers: string[] = monthData.o.entityColumns || [];
        
        providers.forEach(provider => {
          // Skip non-provider columns like "Total"
          if (provider === "Total" || provider === "All Businesses") return;
          
          // Find revenue for this provider
          const revenue = getProviderRevenue(month, provider, 'o');
          const expenses = getProviderPayroll(month, provider, 'o');
          const netIncome = getProviderNetIncome(month, provider, 'o');
          
          // Add to result if we have data
          if (revenue !== 0 || expenses !== 0) {
            result.push({
              provider,
              month,
              fileType: 'Business (O)',
              revenue,
              expenses,
              netIncome,
              profitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0
            });
          }
        });
      }
    });
    
    return result;
  }, [monthlyData, availableMonths, getProviderRevenue, getProviderPayroll, getProviderNetIncome]);
  
  // Get top performing providers by revenue
  const topPerformers = useMemo(() => {
    // Group by provider and sum their revenue
    const providerTotals = providerData.reduce((acc, item) => {
      const key = item.provider;
      if (!acc[key]) {
        acc[key] = {
          provider: key,
          revenue: 0,
          expenses: 0, 
          netIncome: 0,
          fileType: item.fileType
        };
      }
      acc[key].revenue += item.revenue;
      acc[key].expenses += item.expenses;
      acc[key].netIncome += item.netIncome;
      return acc;
    }, {});
    
    // Convert to array and sort by revenue
    return Object.values(providerTotals)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10
  }, [providerData]);
  
  // Calculate monthly performance metrics
  const monthlyPerformance = useMemo(() => {
    return availableMonths.map(month => {
      const monthData = monthlyData[month.toLowerCase()];
      if (!monthData) return null;
      
      let eRevenue = 0;
      let eExpenses = 0;
      let eNetIncome = 0;
      let oRevenue = 0;
      let oExpenses = 0;
      let oNetIncome = 0;
      
      // Sum all provider values for E files
      if (monthData.e && monthData.e.lineItems) {
        const totalRevenueItem = monthData.e.lineItems.find(item => 
          item.name === "Total Revenue" && item.isTotal
        );
        
        const totalExpensesItem = monthData.e.lineItems.find(item => 
          item.name === "Total Operating Expenses" && item.isTotal
        );
        
        const netIncomeItem = monthData.e.lineItems.find(item => 
          (item.name === "Net Income (Loss)" || item.name === "Net Income") && item.isTotal
        );
        
        eRevenue = totalRevenueItem ? Math.abs(totalRevenueItem.summaryValue || 0) : 0;
        eExpenses = totalExpensesItem ? Math.abs(totalExpensesItem.summaryValue || 0) : 0;
        eNetIncome = netIncomeItem ? netIncomeItem.summaryValue || 0 : 0;
      }
      
      // Sum all provider values for O files
      if (monthData.o && monthData.o.lineItems) {
        const totalRevenueItem = monthData.o.lineItems.find(item => 
          item.name === "Total Revenue" && item.isTotal
        );
        
        const totalExpensesItem = monthData.o.lineItems.find(item => 
          item.name === "Total Operating Expenses" && item.isTotal
        );
        
        const netIncomeItem = monthData.o.lineItems.find(item => 
          (item.name === "Net Income (Loss)" || item.name === "Net Income") && item.isTotal
        );
        
        oRevenue = totalRevenueItem ? Math.abs(totalRevenueItem.summaryValue || 0) : 0;
        oExpenses = totalExpensesItem ? Math.abs(totalExpensesItem.summaryValue || 0) : 0;
        oNetIncome = netIncomeItem ? netIncomeItem.summaryValue || 0 : 0;
      }
      
      return {
        month,
        eRevenue,
        eExpenses,
        eNetIncome,
        oRevenue,
        oExpenses,
        oNetIncome,
        totalRevenue: eRevenue + oRevenue,
        totalExpenses: eExpenses + oExpenses,
        totalNetIncome: eNetIncome + oNetIncome
      };
    }).filter(Boolean);
  }, [monthlyData, availableMonths]);
  
  // Calculate revenue distribution by provider
  const revenueDistribution = useMemo(() => {
    // Group by provider and sum their revenue
    const providerRevenue = providerData.reduce((acc, item) => {
      const key = item.provider;
      if (!acc[key]) {
        acc[key] = {
          provider: key,
          value: 0,
          fileType: item.fileType
        };
      }
      acc[key].value += item.revenue;
      return acc;
    }, {});
    
    // Convert to array and sort by revenue
    return Object.values(providerRevenue)
      .sort((a: any, b: any) => b.value - a.value)
      .filter((item: any) => item.value > 0); // Only include positive revenue
  }, [providerData]);

  // Color scale for pie charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57',
    '#83a6ed', '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d'
  ];
  
  // Format for tooltip display
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-semibold">{label || payload[0].payload.provider || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.dataKey.includes('profitMargin') 
                ? `${entry.value.toFixed(2)}%` 
                : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Deep Financial Analysis</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Monthly E vs O Comparison */}
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-xl font-semibold">Monthly Revenue Comparison: Employee vs Business</CardTitle>
            <CardDescription>Comparing monthly revenue between Employee (E) and Business (O) files</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyPerformance}
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${Math.abs(value) >= 1000000 
                    ? `${(value / 1000000).toFixed(1)}M` 
                    : (Math.abs(value) >= 1000 
                        ? `${(value / 1000).toFixed(0)}K` 
                        : value)}`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="eRevenue" name="Employee Revenue" fill="#8884d8" />
                  <Bar dataKey="oRevenue" name="Business Revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Provider Revenue Distribution */}
        <Card className="shadow-lg border-t-4 border-green-500">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-xl font-semibold">Revenue Distribution by Provider</CardTitle>
            <CardDescription>Share of total revenue contributed by each provider</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="provider"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Performers */}
        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-xl font-semibold">Top Performing Providers</CardTitle>
            <CardDescription>Revenue, expenses, and net income for top providers</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPerformers}
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => 
                    `$${Math.abs(value) >= 1000000 
                      ? `${(value / 1000000).toFixed(1)}M` 
                      : (Math.abs(value) >= 1000 
                          ? `${(value / 1000).toFixed(0)}K` 
                          : value)}`
                  } />
                  <YAxis dataKey="provider" type="category" width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                  <Bar dataKey="expenses" name="Expenses" fill="#82ca9d" />
                  <Bar dataKey="netIncome" name="Net Income" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Provider Profit Margin Analysis */}
        <Card className="shadow-lg border-t-4 border-orange-500">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-xl font-semibold">Provider Profit Margin Analysis</CardTitle>
            <CardDescription>Comparing profit margins across top providers</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Tabs defaultValue="bar">
              <TabsList className="mb-4">
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="line">Monthly Trend</TabsTrigger>
              </TabsList>
              
              <TabsContent value="bar" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={providerData.filter(d => d.profitMargin !== 0 && !isNaN(d.profitMargin)).slice(0, 20)}
                    margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="provider" 
                      angle={-45} 
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                    <Tooltip 
                      formatter={(value) => [`${(value as number).toFixed(2)}%`, 'Profit Margin']}
                      labelFormatter={(label) => `Provider: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="profitMargin" name="Profit Margin %" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="line" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyPerformance}
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value) => {
                        if (typeof value === 'number') {
                          return [`${value.toFixed(2)}%`, ''];
                        }
                        return [value, ''];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={(data) => data.eRevenue > 0 ? (data.eNetIncome / data.eRevenue) * 100 : 0} 
                      name="Employee Margin" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey={(data) => data.oRevenue > 0 ? (data.oNetIncome / data.oRevenue) * 100 : 0} 
                      name="Business Margin" 
                      stroke="#82ca9d" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey={(data) => data.totalRevenue > 0 ? (data.totalNetIncome / data.totalRevenue) * 100 : 0} 
                      name="Total Margin" 
                      stroke="#ffc658" 
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Monthly Expense Breakdown */}
        <Card className="shadow-lg border-t-4 border-red-500">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-xl font-semibold">Monthly Expense Analysis</CardTitle>
            <CardDescription>Comparing expenses between Employee and Business files</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyPerformance}
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `$${Math.abs(value) >= 1000000 
                      ? `${(value / 1000000).toFixed(1)}M` 
                      : (Math.abs(value) >= 1000 
                          ? `${(value / 1000).toFixed(0)}K` 
                          : value)}`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="eExpenses" name="Employee Expenses" fill="#FF8042" />
                  <Bar dataKey="oExpenses" name="Business Expenses" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Net Income Comparison */}
        <Card className="shadow-lg border-t-4 border-indigo-500">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-xl font-semibold">Net Income Comparison</CardTitle>
            <CardDescription>Monthly net income for Employee vs Business files</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyPerformance}
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `$${Math.abs(value) >= 1000000 
                      ? `${(value / 1000000).toFixed(1)}M` 
                      : (Math.abs(value) >= 1000 
                          ? `${(value / 1000).toFixed(0)}K` 
                          : value)}`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="eNetIncome" 
                    name="Employee Net Income" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="oNetIncome" 
                    name="Business Net Income" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalNetIncome" 
                    name="Total Net Income" 
                    stroke="#ffc658" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeepAnalysis;