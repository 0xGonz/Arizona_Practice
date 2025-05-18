import React, { useMemo, useState } from "react";
import { useStore } from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area
} from "recharts";

// Format currency values
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage values
const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const DeepAnalysis = () => {
  const { 
    monthlyData,
    getProviderRevenue,
    getProviderPayroll,
    getProviderNetIncome,
    getAvailableMonths
  } = useStore();
  
  // Get available months and sort them chronologically (January to December)
  const availableMonths = useMemo(() => {
    const months = getAvailableMonths();
    console.log("Available months in data store:", months);
    
    // Define month order for proper sorting
    const monthOrder = {
      'january': 1,
      'february': 2, 
      'march': 3,
      'april': 4,
      'may': 5,
      'june': 6,
      'july': 7,
      'august': 8,
      'september': 9,
      'october': 10,
      'november': 11,
      'december': 12
    };
    
    // Sort months chronologically
    const sortedMonths = months.sort((a, b) => {
      const aMonth = a.toLowerCase();
      const bMonth = b.toLowerCase();
      return monthOrder[aMonth] - monthOrder[bMonth];
    });

    console.log("Sorted months:", sortedMonths);
    return sortedMonths;
  }, [getAvailableMonths]);
  const [selectedView, setSelectedView] = useState<'doctors' | 'business'>('doctors');

  // Extract provider data from both E and O files
  const providerData = useMemo(() => {
    const result: any[] = [];
    
    // Process each month's data
    availableMonths.forEach((month: string) => {
      const monthData = monthlyData[month.toLowerCase()];
      if (!monthData) return;
      
      // Get provider data from E files (doctors/employees)
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
              fileType: 'Doctor',
              type: 'e',
              revenue,
              expenses,
              netIncome,
              profitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0
            });
          }
        });
      }
      
      // Get provider data from O files (businesses/departments)
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
              fileType: 'Business',
              type: 'o',
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
  
  // Doctor data aggregated by provider
  const doctorData = useMemo(() => {
    const doctors = providerData
      .filter(item => item.fileType === 'Doctor')
      .reduce((acc, item) => {
        const key = item.provider;
        if (!acc[key]) {
          acc[key] = {
            provider: key,
            revenue: 0,
            expenses: 0,
            netIncome: 0,
            profitMargin: 0,
            monthlyData: {}
          };
        }
        
        // Aggregate total values
        acc[key].revenue += item.revenue;
        acc[key].expenses += item.expenses;
        acc[key].netIncome += item.netIncome;
        
        // Track monthly values
        if (!acc[key].monthlyData[item.month]) {
          acc[key].monthlyData[item.month] = {
            revenue: 0,
            expenses: 0,
            netIncome: 0
          };
        }
        
        acc[key].monthlyData[item.month].revenue += item.revenue;
        acc[key].monthlyData[item.month].expenses += item.expenses;
        acc[key].monthlyData[item.month].netIncome += item.netIncome;
        
        return acc;
      }, {});
    
    // Calculate profit margins and convert to array
    return Object.values(doctors).map((doctor: any) => ({
      ...doctor,
      profitMargin: doctor.revenue > 0 ? (doctor.netIncome / doctor.revenue) * 100 : 0
    }));
  }, [providerData]);
  
  // Business data aggregated by provider
  const businessData = useMemo(() => {
    const businesses = providerData
      .filter(item => item.fileType === 'Business')
      .reduce((acc, item) => {
        const key = item.provider;
        if (!acc[key]) {
          acc[key] = {
            provider: key,
            revenue: 0,
            expenses: 0,
            netIncome: 0,
            profitMargin: 0,
            monthlyData: {}
          };
        }
        
        // Aggregate total values
        acc[key].revenue += item.revenue;
        acc[key].expenses += item.expenses;
        acc[key].netIncome += item.netIncome;
        
        // Track monthly values
        if (!acc[key].monthlyData[item.month]) {
          acc[key].monthlyData[item.month] = {
            revenue: 0,
            expenses: 0,
            netIncome: 0
          };
        }
        
        acc[key].monthlyData[item.month].revenue += item.revenue;
        acc[key].monthlyData[item.month].expenses += item.expenses;
        acc[key].monthlyData[item.month].netIncome += item.netIncome;
        
        return acc;
      }, {});
    
    // Calculate profit margins and convert to array
    return Object.values(businesses).map((business: any) => ({
      ...business,
      profitMargin: business.revenue > 0 ? (business.netIncome / business.revenue) * 100 : 0
    }));
  }, [providerData]);
  
  // Top performing doctors by revenue
  const topDoctors = useMemo(() => {
    return [...doctorData]
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [doctorData]);
  
  // Top performing businesses by revenue
  const topBusinesses = useMemo(() => {
    return [...businessData]
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [businessData]);
  
  // Most profitable doctors by profit margin
  const topProfitableDoctors = useMemo(() => {
    return [...doctorData]
      .filter((d: any) => d.revenue > 50000) // Only significant revenue
      .sort((a: any, b: any) => b.profitMargin - a.profitMargin)
      .slice(0, 10);
  }, [doctorData]);
  
  // Most profitable businesses by profit margin
  const topProfitableBusinesses = useMemo(() => {
    return [...businessData]
      .filter((d: any) => d.revenue > 20000) // Only significant revenue
      .sort((a: any, b: any) => b.profitMargin - a.profitMargin)
      .slice(0, 10);
  }, [businessData]);
  
  // Monthly performance metrics
  const monthlyPerformance = useMemo(() => {
    return availableMonths.map((month: string) => {
      const monthData = monthlyData[month.toLowerCase()];
      if (!monthData) return null;
      
      let eRevenue = 0;
      let eExpenses = 0;
      let eNetIncome = 0;
      let oRevenue = 0;
      let oExpenses = 0;
      let oNetIncome = 0;
      
      // Find specific line items from E files
      if (monthData.e && monthData.e.lineItems) {
        // Logging all total line items to help debug
        const totalItems = monthData.e.lineItems.filter(item => item.isTotal);
        console.log(`E file total line items for ${month}:`, totalItems.map(item => item.name));
        
        // Look for exact line item names as specified
        const totalRevenueItem = monthData.e.lineItems.find(item => 
          item.name === "Total Revenue" && item.isTotal
        );
        
        const totalExpensesItem = monthData.e.lineItems.find(item => 
          item.name === "Total Operating Expenses" && item.isTotal
        );
        
        // Looking for any of the possible Net Income line item names
        const netIncomeItem = monthData.e.lineItems.find(item => 
          (item.name === "Net Income" || 
           item.name === "Net Income (Loss)" || 
           item.name === "Total Net Income" || 
           item.name === "Net Profit" || 
           item.name === "Total Net Profit") && item.isTotal
        );
        
        // If these exact items can't be found, log a warning
        if (!totalRevenueItem) console.log(`Warning: 'Total Revenue' not found in E file for ${month}`);
        if (!totalExpensesItem) console.log(`Warning: 'Total Operating Expenses' not found in E file for ${month}`);
        if (!netIncomeItem) console.log(`Warning: 'Net Income' not found in E file for ${month}`);
        
        // Extract the values, with fallbacks just in case
        eRevenue = totalRevenueItem ? Math.abs(totalRevenueItem.summaryValue || 0) : 0;
        eExpenses = totalExpensesItem ? Math.abs(totalExpensesItem.summaryValue || 0) : 0;
        
        // Try to get Net Income from line item, but if not found, calculate it from Revenue - Expenses
        if (netIncomeItem) {
          eNetIncome = netIncomeItem.summaryValue || 0;
        } else {
          // Calculate Net Income directly from Revenue - Expenses
          eNetIncome = eRevenue - eExpenses;
          console.log(`Calculated Net Income for E data in ${month}: ${eNetIncome} (Revenue ${eRevenue} - Expenses ${eExpenses})`);
        }
        
        console.log(`Found Revenue for E data in ${month}: ${eRevenue}`);
        console.log(`Found Expenses for E data in ${month}: ${eExpenses}`);
        console.log(`Found Net Income for E data in ${month}: ${eNetIncome}`);
      }
      
      // Find specific line items from O files
      if (monthData.o && monthData.o.lineItems) {
        // Logging all total line items to help debug
        const totalItems = monthData.o.lineItems.filter(item => item.isTotal);
        console.log(`O file total line items for ${month}:`, totalItems.map(item => item.name));
        
        // Look for exact line item names as specified
        const totalRevenueItem = monthData.o.lineItems.find(item => 
          item.name === "Total Revenue" && item.isTotal
        );
        
        const totalExpensesItem = monthData.o.lineItems.find(item => 
          item.name === "Total Operating Expenses" && item.isTotal
        );
        
        // Looking for any of the possible Net Income line item names
        const netIncomeItem = monthData.o.lineItems.find(item => 
          (item.name === "Net Income" || 
           item.name === "Net Income (Loss)" || 
           item.name === "Total Net Income" || 
           item.name === "Net Profit" || 
           item.name === "Total Net Profit") && item.isTotal
        );
        
        // If these exact items can't be found, log a warning
        if (!totalRevenueItem) console.log(`Warning: 'Total Revenue' not found in O file for ${month}`);
        if (!totalExpensesItem) console.log(`Warning: 'Total Operating Expenses' not found in O file for ${month}`);
        if (!netIncomeItem) console.log(`Warning: 'Net Income' not found in O file for ${month}`);
        
        // Extract the values, with fallbacks just in case
        oRevenue = totalRevenueItem ? Math.abs(totalRevenueItem.summaryValue || 0) : 0;
        oExpenses = totalExpensesItem ? Math.abs(totalExpensesItem.summaryValue || 0) : 0;
        
        // Try to get Net Income from line item, but if not found, calculate it from Revenue - Expenses
        if (netIncomeItem) {
          oNetIncome = netIncomeItem.summaryValue || 0;
        } else {
          // Calculate Net Income directly from Revenue - Expenses
          oNetIncome = oRevenue - oExpenses;
          console.log(`Found Net Income for O data in ${month}: ${oNetIncome}`);
        }
        
        console.log(`Found Revenue for O data in ${month}: ${oRevenue}`);
        console.log(`Found Expenses for O data in ${month}: ${oExpenses}`);
        console.log(`Found Net Income for O data in ${month}: ${oNetIncome}`);
      }
      
      // Calculate profit margins
      const eMargin = eRevenue > 0 ? (eNetIncome / eRevenue) * 100 : 0;
      const oMargin = oRevenue > 0 ? (oNetIncome / oRevenue) * 100 : 0;
      const totalMargin = (eRevenue + oRevenue) > 0 ? 
        ((eNetIncome + oNetIncome) / (eRevenue + oRevenue)) * 100 : 0;
      
      console.log(`Month: ${month} - Revenue: ${eRevenue + oRevenue}, Expenses: ${eExpenses + oExpenses}, NetIncome: ${eNetIncome + oNetIncome}`);
      
      return {
        month,
        doctorRevenue: eRevenue,
        doctorExpenses: eExpenses,
        doctorNetIncome: eNetIncome,
        doctorMargin: eMargin,
        businessRevenue: oRevenue,
        businessExpenses: oExpenses,
        businessNetIncome: oNetIncome,
        businessMargin: oMargin,
        totalRevenue: eRevenue + oRevenue,
        totalExpenses: eExpenses + oExpenses,
        totalNetIncome: eNetIncome + oNetIncome,
        totalMargin: totalMargin
      };
    }).filter(Boolean);
  }, [monthlyData, availableMonths]);
  
  // Extract monthly payroll expenses
  const monthlyPayroll = useMemo(() => {
    return availableMonths.map((month: string) => {
      const monthData = monthlyData[month.toLowerCase()];
      if (!monthData) return null;
      
      let doctorPayroll = 0;
      let businessPayroll = 0;
      
      // Find payroll in E files
      if (monthData.e && monthData.e.lineItems) {
        // First look specifically for the exact line item
        let payrollItem = monthData.e.lineItems.find(item => 
          item.name === "Total Payroll and Related Expense" && item.isTotal
        );
        
        // If not found, try alternative naming
        if (!payrollItem) {
          payrollItem = monthData.e.lineItems.find(item => 
            (item.name === "Total Payroll & Related Expense" && item.isTotal) ||
            (item.name === "Total Payroll Expense" && item.isTotal)
          );
        }
        
        // Last resort, look for any payroll line item that is a total
        if (!payrollItem) {
          payrollItem = monthData.e.lineItems.find(item => 
            (item.name.includes("Payroll") && item.isTotal)
          );
        }
        
        if (payrollItem) {
          doctorPayroll = Math.abs(payrollItem.summaryValue || 0);
          console.log(`Found E Payroll expense in ${month}: ${doctorPayroll}`);
        }
      }
      
      // Find payroll in O files
      if (monthData.o && monthData.o.lineItems) {
        // First look specifically for the exact line item
        let payrollItem = monthData.o.lineItems.find(item => 
          item.name === "Total Payroll and Related Expense" && item.isTotal
        );
        
        // If not found, try alternative naming
        if (!payrollItem) {
          payrollItem = monthData.o.lineItems.find(item => 
            (item.name === "Total Payroll & Related Expense" && item.isTotal) ||
            (item.name === "Total Payroll Expense" && item.isTotal)
          );
        }
        
        // Last resort, look for any payroll line item that is a total
        if (!payrollItem) {
          payrollItem = monthData.o.lineItems.find(item => 
            (item.name.includes("Payroll") && item.isTotal)
          );
        }
        
        if (payrollItem) {
          businessPayroll = Math.abs(payrollItem.summaryValue || 0);
          console.log(`Found O Payroll expense in ${month}: ${businessPayroll}`);
        }
      }
      
      return {
        month,
        doctorPayroll,
        businessPayroll,
        totalPayroll: doctorPayroll + businessPayroll
      };
    }).filter(Boolean);
  }, [monthlyData, availableMonths]);
  
  // Color scheme - more professional and visually distinct
  const COLORS = {
    doctor: '#6366f1', // Indigo for doctor data
    business: '#10b981', // Emerald for business data
    combined: '#f59e0b', // Amber for combined data
    expenses: '#ef4444', // Red for expenses
    netIncome: '#f59e0b', // Yellow/orange for net income
    revenue: '#8b5cf6', // Purple for revenue
    payroll: '#ec4899', // Pink for payroll
    payrollDoctor: '#9333ea', // Darker purple for doctor payroll
    payrollBusiness: '#059669'  // Darker green for business payroll
  };
  
  // Colors for pie charts
  const PIE_COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#a855f7', '#14b8a6', '#f43f5e',
    '#0ea5e9', '#84cc16', '#f97316', '#06b6d4', '#8b5cf6'
  ];
  
  // Set up view type for data toggle
  const [dataView, setDataView] = useState<'doctor' | 'business' | 'combined'>('combined');

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h1 className="text-3xl font-bold mb-2">Provider Performance Analysis</h1>
        <p className="text-gray-600">Comprehensive financial comparison between doctor and business operations</p>
      </div>
      
      {/* All-in-One Financial Performance Card */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Comprehensive Financial Performance</h2>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md ${dataView === 'combined' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setDataView('combined')}
            >
              Total (E+O)
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md ${dataView === 'doctor' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setDataView('doctor')}
            >
              Doctor Data (E)
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md ${dataView === 'business' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setDataView('business')}
            >
              Business Data (O)
            </button>
          </div>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50 py-3">
            <CardTitle>
              {dataView === 'doctor' && 'Doctor Financial Performance (E-File)'}
              {dataView === 'business' && 'Business Financial Performance (O-File)'}
              {dataView === 'combined' && 'Combined Financial Performance'}
            </CardTitle>
            <CardDescription>Monthly comparison of revenue, expenses, payroll and net income</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyPerformance}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `$${Math.abs(value) >= 1000000 
                      ? `${(value / 1000000).toFixed(1)}M` 
                      : (Math.abs(value) >= 1000 
                          ? `${(value / 1000).toFixed(0)}K` 
                          : value)}`} 
                  />
                  <Legend />
                  
                  {dataView === 'doctor' && (
                    <>
                      <Bar dataKey="doctorRevenue" name="Doctor Revenue" fill={COLORS.revenue} />
                      <Bar 
                        dataKey={(entry) => {
                          // Find the payroll amount for this month
                          const payrollData = monthlyPayroll.find(p => p?.month === entry.month);
                          const doctorPayroll = payrollData?.doctorPayroll || 0;
                          // Return the amount that represents only non-payroll expenses
                          return Math.max(0, entry.doctorExpenses - doctorPayroll);
                        }}
                        name="Doctor Other Expenses" 
                        fill={COLORS.expenses} 
                        stackId="expenses" 
                      />
                      <Bar 
                        dataKey={(entry) => {
                          const payrollData = monthlyPayroll.find(p => p?.month === entry.month);
                          return payrollData?.doctorPayroll || 0;
                        }}
                        name="Doctor Payroll" 
                        fill={COLORS.payrollDoctor} 
                        stackId="expenses" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="doctorNetIncome" 
                        name="Doctor Net Income" 
                        stroke={COLORS.netIncome} 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </>
                  )}
                  
                  {dataView === 'business' && (
                    <>
                      <Bar dataKey="businessRevenue" name="Business Revenue" fill={COLORS.revenue} />
                      <Bar 
                        dataKey={(entry) => {
                          // Find the payroll amount for this month
                          const payrollData = monthlyPayroll.find(p => p?.month === entry.month);
                          const businessPayroll = payrollData?.businessPayroll || 0;
                          // Return the amount that represents only non-payroll expenses
                          return Math.max(0, entry.businessExpenses - businessPayroll);
                        }}
                        name="Business Other Expenses" 
                        fill={COLORS.expenses} 
                        stackId="expenses" 
                      />
                      <Bar 
                        dataKey={(entry) => {
                          const payrollData = monthlyPayroll.find(p => p?.month === entry.month);
                          return payrollData?.businessPayroll || 0;
                        }}
                        name="Business Payroll" 
                        fill={COLORS.payrollBusiness} 
                        stackId="expenses" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="businessNetIncome" 
                        name="Business Net Income" 
                        stroke={COLORS.netIncome} 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </>
                  )}
                  
                  {dataView === 'combined' && (
                    <>
                      <Bar dataKey="totalRevenue" name="Total Revenue" fill={COLORS.revenue} />
                      <Bar 
                        dataKey={(entry) => {
                          // Find the payroll amount for this month
                          const payrollData = monthlyPayroll.find(p => p?.month === entry.month);
                          const totalPayroll = (payrollData?.doctorPayroll || 0) + (payrollData?.businessPayroll || 0);
                          // Return the amount that represents only non-payroll expenses
                          return Math.max(0, entry.totalExpenses - totalPayroll);
                        }}
                        name="Other Expenses" 
                        fill={COLORS.expenses} 
                        stackId="expenses" 
                      />
                      <Bar 
                        dataKey={(entry) => {
                          const payrollData = monthlyPayroll.find(p => p?.month === entry.month);
                          // Calculate the sum of doctor and business payroll to ensure we get accurate numbers
                          return (payrollData?.doctorPayroll || 0) + (payrollData?.businessPayroll || 0);
                        }} 
                        name="Total Payroll" 
                        fill={COLORS.payroll} 
                        stackId="expenses" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalNetIncome" 
                        name="Total Net Income" 
                        stroke={COLORS.netIncome} 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </>
                  )}
                  
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const month = label;
                        const payrollData = monthlyPayroll.find(item => item?.month === month);
                        
                        let payrollValue = 0;
                        if (dataView === 'doctor') {
                          payrollValue = payrollData?.doctorPayroll || 0;
                        } else if (dataView === 'business') {
                          payrollValue = payrollData?.businessPayroll || 0;
                        } else {
                          payrollValue = payrollData?.totalPayroll || 0;
                        }
                        
                        // Get the corresponding expense amount
                        let expenseValue = 0;
                        if (dataView === 'doctor') {
                          expenseValue = monthlyPerformance.find(p => p.month === month)?.doctorExpenses || 0;
                        } else if (dataView === 'business') {
                          expenseValue = monthlyPerformance.find(p => p.month === month)?.businessExpenses || 0;
                        } else {
                          expenseValue = monthlyPerformance.find(p => p.month === month)?.totalExpenses || 0;
                        }
                        
                        // Calculate payroll as percentage of expenses
                        const payrollPercent = expenseValue > 0 ? (payrollValue / expenseValue * 100).toFixed(1) : 0;
                        
                        return (
                          <div className="bg-white p-4 border rounded shadow-lg">
                            <p className="font-bold">{month}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm">
                                <span style={{ color: entry.color }}>●</span> {entry.name}: {formatCurrency(entry.value as number)}
                              </p>
                            ))}
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-sm font-medium">Payroll Details:</p>
                              <p className="text-sm">
                                <span style={{ color: COLORS.payroll }}>●</span> Payroll: {formatCurrency(payrollValue)}
                              </p>
                              <p className="text-sm">
                                <span style={{ color: COLORS.payroll }}>●</span> Payroll % of Expenses: {payrollPercent}%
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Profit Margin Analysis Section Removed
          Monthly Payroll Expenses data is now combined with the Comprehensive Financial Performance chart
      */}
      
      {/* Provider Performance Section - New Consolidated View */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Provider Performance Analysis</h2>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md ${selectedView === 'doctors' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setSelectedView('doctors')}
            >
              Doctor Data (E)
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md ${selectedView === 'business' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setSelectedView('business')}
            >
              Business Data (O)
            </button>
          </div>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50 py-3">
            <CardTitle>
              {selectedView === 'doctors' ? 'Provider Revenue, Expenses & Profit Analysis (E-Files)' : 'Business Unit Revenue, Expenses & Profit Analysis (O-Files)'}
            </CardTitle>
            <CardDescription>
              Detailed financial breakdown by {selectedView === 'doctors' ? 'provider' : 'business unit'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedView === 'doctors' ? 
                    // List of specific doctors as requested
                    doctorData.filter(d => ['Dr Noori', 'Dr Diep', 'Dr Heiner', 'Dr Anderson', 'Dr Killian', 
                                           'Barnes, James', 'Dr Wright', 'Aggarwal, Nitish', 'Sitzer, Tiarra', "O'Haver"]
                                           .includes(d.provider))
                    : 
                    // List of specific business units as requested
                    businessData.filter(b => ['Therapy,Physical', 'MedShip,MedShip', 'Imaging,imaging', 'Pharmacy',
                                           'MRI, MRI', 'DME, DME', 'NXT STIM', 'ProMed,ProMed', 'ProcedureCharges', 'UDA, UDA']
                                           .includes(b.provider))
                  }
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis type="category" dataKey="provider" width={120} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') return formatCurrency(value as number);
                      if (name === 'expenses') return formatCurrency(value as number);
                      if (name === 'netIncome') return formatCurrency(value as number);
                      if (name === 'profitMargin') return `${(value as number).toFixed(1)}%`;
                      return value;
                    }}
                    labelFormatter={(label) => `Provider: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue" 
                    fill={COLORS.revenue} 
                    label={(props) => {
                      const { x, y, width, value } = props;
                      return (
                        <text 
                          x={x + width + 5} 
                          y={y + 4} 
                          fill={COLORS.revenue} 
                          fontSize={10}
                          textAnchor="start"
                        >
                          {formatCurrency(value as number)}
                        </text>
                      );
                    }}
                  />
                  <Bar 
                    dataKey={(entry) => {
                      // Calculate non-payroll expenses
                      return Math.max(0, entry.expenses - (entry.expenses * 0.75)); // Estimate non-payroll expenses
                    }}
                    name="Other Expenses" 
                    fill={COLORS.expenses} 
                    stackId="expenses" 
                  />
                  <Bar 
                    dataKey={(entry) => {
                      // Estimate payroll expenses at 75% of total expenses
                      return entry.expenses * 0.75;
                    }}
                    name="Est. Payroll" 
                    fill={selectedView === 'doctors' ? COLORS.payrollDoctor : COLORS.payrollBusiness} 
                    stackId="expenses" 
                  />
                  <Bar 
                    dataKey="netIncome" 
                    name="Net Income" 
                    fill={COLORS.netIncome} 
                    label={(props) => {
                      const { x, y, width, value } = props;
                      const displayValue = (value as number) >= 0 ? 
                        formatCurrency(value as number) : 
                        `(${formatCurrency(Math.abs(value as number))})`;
                      
                      return (
                        <text 
                          x={x + width + 5} 
                          y={y + 4} 
                          fill={(value as number) >= 0 ? COLORS.netIncome : '#ff0000'} 
                          fontSize={10}
                          textAnchor="start"
                        >
                          {displayValue}
                        </text>
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Removed old TabsContent value="doctors" section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50 py-3">
                <CardTitle>Top Doctors by Revenue</CardTitle>
                <CardDescription>Top 10 highest revenue-generating doctors</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topDoctors}
                      margin={{ top: 20, right: 20, left: 100, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <YAxis 
                        dataKey="provider" 
                        type="category" 
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), ""]}
                        labelFormatter={(label) => `Doctor: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill={COLORS.revenue} />
                      <Bar dataKey="expenses" name="Expenses" fill={COLORS.expenses} />
                      <Bar dataKey="netIncome" name="Net Income" fill={COLORS.netIncome} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50 py-3">
                <CardTitle>Most Profitable Doctors</CardTitle>
                <CardDescription>Doctors with highest profit margins</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProfitableDoctors}
                      margin={{ top: 20, right: 20, left: 100, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis 
                        dataKey="provider" 
                        type="category" 
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "profitMargin") 
                            return [`${(value as number).toFixed(2)}%`, "Profit Margin"];
                          return [formatCurrency(value as number), name];
                        }}
                        labelFormatter={(label) => `Doctor: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="profitMargin" name="Profit Margin" fill={COLORS.doctor}>
                        {topProfitableDoctors.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-lg mb-6">
            <CardHeader className="border-b bg-gray-50 py-3">
              <CardTitle>Doctor Revenue Distribution</CardTitle>
              <CardDescription>Percentage breakdown of revenue by doctor</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topDoctors}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={140}
                      dataKey="revenue"
                      nameKey="provider"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {topDoctors.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                      labelFormatter={(label) => `Doctor: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Business Performance Tab */}
        <TabsContent value="businesses" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50 py-3">
                <CardTitle>Top Business Units by Revenue</CardTitle>
                <CardDescription>Top 10 highest revenue-generating business units</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topBusinesses}
                      margin={{ top: 20, right: 20, left: 120, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <YAxis 
                        dataKey="provider" 
                        type="category" 
                        width={120}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), ""]}
                        labelFormatter={(label) => `Business: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill={COLORS.revenue} />
                      <Bar dataKey="expenses" name="Expenses" fill={COLORS.expenses} />
                      <Bar dataKey="netIncome" name="Net Income" fill={COLORS.netIncome} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50 py-3">
                <CardTitle>Most Profitable Business Units</CardTitle>
                <CardDescription>Business units with highest profit margins</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProfitableBusinesses}
                      margin={{ top: 20, right: 20, left: 120, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis 
                        dataKey="provider" 
                        type="category" 
                        width={120}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "profitMargin") 
                            return [`${(value as number).toFixed(2)}%`, "Profit Margin"];
                          return [formatCurrency(value as number), name];
                        }}
                        labelFormatter={(label) => `Business: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="profitMargin" name="Profit Margin" fill={COLORS.business}>
                        {topProfitableBusinesses.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-lg mb-6">
            <CardHeader className="border-b bg-gray-50 py-3">
              <CardTitle>Business Revenue Distribution</CardTitle>
              <CardDescription>Percentage breakdown of revenue by business unit</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topBusinesses}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={140}
                      dataKey="revenue"
                      nameKey="provider"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {topBusinesses.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                      labelFormatter={(label) => `Business: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Summary Section */}
      <Card className="shadow-lg mb-8">
        <CardHeader className="border-b bg-gray-50 py-3">
          <CardTitle>Financial Performance Summary</CardTitle>
          <CardDescription>Overall revenue and expense breakdown</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyPerformance}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => `$${Math.abs(value) >= 1000000 
                    ? `${(value / 1000000).toFixed(1)}M` 
                    : (Math.abs(value) >= 1000 
                        ? `${(value / 1000).toFixed(0)}K` 
                        : value)}`} 
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `${value}%`}
                  domain={[-30, 50]}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "totalMargin") 
                      return [`${(value as number).toFixed(2)}%`, "Profit Margin"];
                    return [formatCurrency(value as number), name];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="totalRevenue" 
                  name="Total Revenue" 
                  fill={`${COLORS.revenue}33`}
                  stroke={COLORS.revenue}
                  fillOpacity={0.3}
                />
                <Bar yAxisId="left" dataKey="totalExpenses" name="Total Expenses" fill={COLORS.expenses} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="totalNetIncome" 
                  name="Net Income" 
                  stroke={COLORS.netIncome}
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="totalMargin" 
                  name="Profit Margin" 
                  stroke="#ff0000"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeepAnalysis;