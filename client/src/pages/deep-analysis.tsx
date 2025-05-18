import React, { useMemo, useState } from "react";
import { useStore } from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      return monthOrder[aMonth as keyof typeof monthOrder] - monthOrder[bMonth as keyof typeof monthOrder];
    });

    console.log("Sorted months:", sortedMonths);
    return sortedMonths;
  }, [getAvailableMonths]);
  
  const [selectedView, setSelectedView] = useState<'doctors' | 'business'>('doctors');
  const [dataView, setDataView] = useState<'doctor' | 'business' | 'combined'>('combined');

  // Extract provider data from both E and O files
  const providerData = useMemo(() => {
    let doctorData: any[] = [];
    let businessData: any[] = [];
    
    availableMonths.forEach((month: string) => {
      const monthData = monthlyData[month.toLowerCase()];
      if (!monthData) return;
      
      // Process doctor data (E files)
      if (monthData.e) {
        const { entityColumns } = monthData.e;
        entityColumns.forEach(provider => {
          // Skip non-provider columns
          if (provider === 'line_item' || provider === 'description') return;
          
          const revenue = getProviderRevenue(month, provider, 'e');
          const expenses = getProviderPayroll(month, provider, 'e');
          const netIncome = getProviderNetIncome(month, provider, 'e');
          // Get payroll data specifically for this provider and month
          let payroll = 0;
          const payrollItem = monthData.e?.lineItems.find(
            item => item.name === "Total Payroll and Related Expense" || 
                  item.name === "Total Payroll & Related Expense" ||
                  (item.name.toLowerCase().includes("total") && item.name.toLowerCase().includes("payroll"))
          );
          
          if (payrollItem?.entityValues && provider in payrollItem.entityValues) {
            payroll = Math.abs(payrollItem.entityValues[provider] || 0);
            console.log(`Found payroll for provider ${provider}: ${payroll}`);
          }
          
          // Calculate profit margin percentage
          const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
          
          doctorData.push({
            provider,
            revenue,
            expenses,
            netIncome,
            payroll,
            otherExpenses: expenses - payroll,
            profitMargin,
            month
          });
        });
      }
      
      // Process business data (O files)
      if (monthData.o) {
        const { entityColumns } = monthData.o;
        entityColumns.forEach(provider => {
          // Skip non-provider columns
          if (provider === 'line_item' || provider === 'description') return;
          
          const revenue = getProviderRevenue(month, provider, 'o');
          const expenses = getProviderPayroll(month, provider, 'o');
          const netIncome = getProviderNetIncome(month, provider, 'o');
          // Get payroll data specifically for this provider and month
          let payroll = 0;
          const payrollItem = monthData.o?.lineItems.find(
            item => item.name === "Total Payroll and Related Expense" || 
                  item.name === "Total Payroll & Related Expense" ||
                  (item.name.toLowerCase().includes("total") && item.name.toLowerCase().includes("payroll"))
          );
          
          if (payrollItem?.entityValues && provider in payrollItem.entityValues) {
            payroll = Math.abs(payrollItem.entityValues[provider] || 0);
            console.log(`Found payroll for business provider ${provider}: ${payroll}`);
          }
          
          // Calculate profit margin percentage
          const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
          
          businessData.push({
            provider,
            revenue,
            expenses,
            netIncome,
            payroll,
            otherExpenses: expenses - payroll,
            profitMargin,
            month
          });
        });
      }
    });
    
    return { doctorData, businessData };
  }, [monthlyData, availableMonths, getProviderRevenue, getProviderPayroll, getProviderNetIncome]);

  // Get top doctors by revenue
  const topDoctors = useMemo(() => {
    // Group doctors by name and sum their metrics
    const doctorMap = new Map();
    providerData.doctorData.forEach(doctor => {
      if (!doctorMap.has(doctor.provider)) {
        doctorMap.set(doctor.provider, {
          provider: doctor.provider,
          revenue: 0,
          expenses: 0,
          netIncome: 0,
          payroll: 0,
          otherExpenses: 0,
          profitMargin: 0,
          count: 0
        });
      }
      
      const existingDoctor = doctorMap.get(doctor.provider);
      existingDoctor.revenue += doctor.revenue;
      existingDoctor.expenses += doctor.expenses;
      existingDoctor.netIncome += doctor.netIncome;
      existingDoctor.payroll += doctor.payroll || 0;
      existingDoctor.count += 1;
    });
    
    // Calculate derived metrics
    doctorMap.forEach(doctor => {
      if (doctor.count > 0) {
        doctor.profitMargin = doctor.revenue > 0 ? (doctor.netIncome / doctor.revenue) * 100 : 0;
        doctor.otherExpenses = doctor.expenses - doctor.payroll;
      }
    });
    
    // Convert map to array and sort by revenue
    return Array.from(doctorMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [providerData.doctorData]);

  // Get top businesses by revenue
  const topBusinesses = useMemo(() => {
    // Group businesses by name and sum their metrics
    const businessMap = new Map();
    providerData.businessData.forEach(business => {
      if (!businessMap.has(business.provider)) {
        businessMap.set(business.provider, {
          provider: business.provider,
          revenue: 0,
          expenses: 0,
          netIncome: 0,
          payroll: 0,
          otherExpenses: 0,
          profitMargin: 0,
          count: 0
        });
      }
      
      const existingBusiness = businessMap.get(business.provider);
      existingBusiness.revenue += business.revenue;
      existingBusiness.expenses += business.expenses;
      existingBusiness.netIncome += business.netIncome;
      existingBusiness.payroll += business.payroll || 0;
      existingBusiness.count += 1;
    });
    
    // Calculate derived metrics
    businessMap.forEach(business => {
      if (business.count > 0) {
        business.profitMargin = business.revenue > 0 ? (business.netIncome / business.revenue) * 100 : 0;
        business.otherExpenses = business.expenses - business.payroll;
      }
    });
    
    // Convert map to array and sort by revenue
    return Array.from(businessMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [providerData.businessData]);

  // Get most profitable doctors
  const topProfitableDoctors = useMemo(() => {
    return [...topDoctors]
      .filter(doctor => doctor.revenue > 10000) // Filter out doctors with low revenue for better results
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 10);
  }, [topDoctors]);

  // Get most profitable businesses
  const topProfitableBusinesses = useMemo(() => {
    return [...topBusinesses]
      .filter(business => business.revenue > 10000) // Filter out businesses with low revenue for better results
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 10);
  }, [topBusinesses]);

  // Prepare monthly financial data for charts
  const monthlyFinancialData = useMemo(() => {
    return availableMonths.map((month: string) => {
      // Get monthly data for both E and O files
      const monthData = monthlyData[month.toLowerCase()];
      
      // Initialize metrics
      let doctorRevenue = 0;
      let doctorExpenses = 0;
      let doctorNetIncome = 0;
      let doctorPayroll = 0;
      
      let businessRevenue = 0;
      let businessExpenses = 0;
      let businessNetIncome = 0;
      let businessPayroll = 0;
      
      // Get E file metrics (doctors)
      if (monthData?.e) {
        const eData = monthData.e;
        
        // Find the 'Total Revenue' line item
        const totalRevenueLine = eData.lineItems.find(
          item => item.name.toLowerCase().includes('total revenue')
        );
        if (totalRevenueLine) {
          doctorRevenue = totalRevenueLine.total || 0;
        }
        
        // Find the 'Total Expenses' line item
        const totalExpensesLine = eData.lineItems.find(
          item => item.name.toLowerCase().includes('total expenses')
        );
        if (totalExpensesLine) {
          doctorExpenses = totalExpensesLine.total || 0;
        }
        
        // Find the 'Net Income' line item or calculate it
        const netIncomeLine = eData.lineItems.find(
          item => item.name.toLowerCase() === 'net income'
        );
        if (netIncomeLine) {
          doctorNetIncome = netIncomeLine.total || 0;
        } else {
          doctorNetIncome = doctorRevenue - doctorExpenses;
          console.log(`Warning: 'Net Income' not found in E file for ${month}`);
          console.log(`Calculated Net Income for E data in ${month}: ${doctorNetIncome} (Revenue ${doctorRevenue} - Expenses ${doctorExpenses})`);
        }

        // Find the 'Total Payroll and Related Expense' line item
        const payrollLine = eData.lineItems.find(
          item => item.name === "Total Payroll and Related Expense" || 
                 item.name === "Total Payroll & Related Expense" ||
                 (item.name.toLowerCase().includes("total") && item.name.toLowerCase().includes("payroll"))
        );
        if (payrollLine) {
          doctorPayroll = payrollLine.summaryValue || 0;
          console.log(`Found E Payroll expense in ${month}: ${doctorPayroll}`);
        }
        
        console.log(`Found Revenue for E data in ${month}: ${doctorRevenue}`);
        console.log(`Found Expenses for E data in ${month}: ${doctorExpenses}`);
        console.log(`Found Net Income for E data in ${month}: ${doctorNetIncome}`);
      }
      
      // Get O file metrics (business)
      if (monthData?.o) {
        const oData = monthData.o;
        
        console.log(`O file total line items for ${month}:`, oData.lineItems.map(i => i.name));
        
        // Find the 'Total Revenue' line item
        const totalRevenueLine = oData.lineItems.find(
          item => item.name.toLowerCase().includes('total revenue')
        );
        if (totalRevenueLine) {
          businessRevenue = totalRevenueLine.total || 0;
        }
        
        // Find the 'Total Expenses' line item
        const totalExpensesLine = oData.lineItems.find(
          item => item.name.toLowerCase().includes('total expenses')
        );
        if (totalExpensesLine) {
          businessExpenses = totalExpensesLine.total || 0;
        }
        
        // Find the 'Net Income' line item or calculate it
        const netIncomeLine = oData.lineItems.find(
          item => item.name.toLowerCase() === 'net income'
        );
        if (netIncomeLine) {
          businessNetIncome = netIncomeLine.total || 0;
        } else {
          businessNetIncome = businessRevenue - businessExpenses;
          console.log(`Warning: 'Net Income' not found in O file for ${month}`);
        }

        // Find the 'Total Payroll and Related Expense' line item
        const payrollLine = oData.lineItems.find(
          item => item.name === "Total Payroll and Related Expense" || 
                 item.name === "Total Payroll & Related Expense" ||
                 (item.name.toLowerCase().includes("total") && item.name.toLowerCase().includes("payroll"))
        );
        if (payrollLine) {
          businessPayroll = payrollLine.summaryValue || 0;
          console.log(`Found O Payroll expense in ${month}: ${businessPayroll}`);
        }
        
        console.log(`Found Revenue for O data in ${month}: ${businessRevenue}`);
        console.log(`Found Expenses for O data in ${month}: ${businessExpenses}`);
        console.log(`Found Net Income for O data in ${month}: ${businessNetIncome}`);
      }

      // Calculate combined metrics
      const totalRevenue = doctorRevenue + businessRevenue;
      const totalExpenses = doctorExpenses + businessExpenses;
      const totalNetIncome = doctorNetIncome + businessNetIncome;
      const totalPayroll = doctorPayroll + businessPayroll;
      
      // Calculate profit margin percentages
      const doctorProfitMargin = doctorRevenue > 0 ? (doctorNetIncome / doctorRevenue) * 100 : 0;
      const businessProfitMargin = businessRevenue > 0 ? (businessNetIncome / businessRevenue) * 100 : 0;
      const totalProfitMargin = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;
      
      // Calculate payroll as percentage of expenses
      const doctorPayrollPercent = doctorExpenses > 0 ? (doctorPayroll / doctorExpenses) * 100 : 0;
      const businessPayrollPercent = businessExpenses > 0 ? (businessPayroll / businessExpenses) * 100 : 0;
      const totalPayrollPercent = totalExpenses > 0 ? (totalPayroll / totalExpenses) * 100 : 0;

      console.log(`Month: ${month} - Revenue: ${totalRevenue}, Expenses: ${totalExpenses}, NetIncome: ${totalNetIncome}`);
      
      return {
        month: month,
        doctorRevenue,
        doctorExpenses,
        doctorNetIncome,
        doctorProfitMargin,
        doctorPayroll,
        doctorPayrollPercent,
        businessRevenue,
        businessExpenses,
        businessNetIncome,
        businessProfitMargin,
        businessPayroll,
        businessPayrollPercent,
        totalRevenue,
        totalExpenses,
        totalNetIncome,
        totalProfitMargin,
        totalPayroll,
        totalPayrollPercent,
        otherExpenses: totalExpenses - totalPayroll
      };
    });
  }, [monthlyData, availableMonths]);

  // Define chart colors for consistency
  const COLORS = {
    revenue: '#4CAF50', // Green
    expenses: '#FF5722', // Orange/Red
    netIncome: '#FFC107', // Yellow/Gold
    doctor: '#9C27B0', // Purple
    business: '#2196F3', // Blue
    payroll: '#F44336', // Red
    payrollDoctor: '#E91E63', // Pink
    payrollBusiness: '#673AB7' // Deep Purple
  };

  // Colors for pie charts
  const PIE_COLORS = ['#4CAF50', '#2196F3', '#9C27B0', '#F44336', '#FFC107', '#FF5722', '#795548', '#607D8B', '#E91E63', '#673AB7'];

  const { doctorData, businessData } = providerData;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Financial Deep Analysis</h1>
      <p className="text-gray-600 mb-8">
        Comprehensive financial analytics comparing employee (E) and business operation (O) data
      </p>
      
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
          <CardContent className="p-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyFinancialData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (name.includes('ProfitMargin') || name.includes('PayrollPercent')) {
                        return [`${Number(value).toFixed(1)}%`, name.replace(/([A-Z])/g, ' $1').trim()];
                      }
                      return [formatCurrency(value as number), name.replace(/([A-Z])/g, ' $1').trim()];
                    }}
                  />
                  <Legend formatter={(value) => value.replace(/([A-Z])/g, ' $1').trim()} />
                  
                  {/* Revenue Line */}
                  <Line
                    type="monotone"
                    dataKey={
                      dataView === 'doctor' ? 'doctorRevenue' : 
                      dataView === 'business' ? 'businessRevenue' : 'totalRevenue'
                    }
                    name={
                      dataView === 'doctor' ? 'doctorRevenue' : 
                      dataView === 'business' ? 'businessRevenue' : 'totalRevenue'
                    }
                    stroke={COLORS.revenue}
                    strokeWidth={3}
                    yAxisId="left"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Net Income Line */}
                  <Line
                    type="monotone"
                    dataKey={
                      dataView === 'doctor' ? 'doctorNetIncome' : 
                      dataView === 'business' ? 'businessNetIncome' : 'totalNetIncome'
                    }
                    name={
                      dataView === 'doctor' ? 'doctorNetIncome' : 
                      dataView === 'business' ? 'businessNetIncome' : 'totalNetIncome'
                    }
                    stroke={COLORS.netIncome}
                    strokeWidth={3}
                    yAxisId="left"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Payroll Bar */}
                  <Bar
                    dataKey={
                      dataView === 'doctor' ? 'doctorPayroll' : 
                      dataView === 'business' ? 'businessPayroll' : 'totalPayroll'
                    }
                    name={
                      dataView === 'doctor' ? 'doctorPayroll' : 
                      dataView === 'business' ? 'businessPayroll' : 'totalPayroll'
                    }
                    fill={
                      dataView === 'doctor' ? COLORS.payrollDoctor : 
                      dataView === 'business' ? COLORS.payrollBusiness : COLORS.payroll
                    }
                    yAxisId="left"
                    stackId="expenses"
                  />
                  
                  {/* Other Expenses Bar */}
                  <Bar
                    dataKey="otherExpenses"
                    name="otherExpenses"
                    fill={COLORS.expenses}
                    yAxisId="left"
                    stackId="expenses"
                  />
                  
                  {/* Profit Margin Line */}
                  <Line
                    type="monotone"
                    dataKey={
                      dataView === 'doctor' ? 'doctorProfitMargin' : 
                      dataView === 'business' ? 'businessProfitMargin' : 'totalProfitMargin'
                    }
                    name={
                      dataView === 'doctor' ? 'doctorProfitMargin' : 
                      dataView === 'business' ? 'businessProfitMargin' : 'totalProfitMargin'
                    }
                    stroke="#8884d8"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    yAxisId="right"
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
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
                    // Use the top 10 doctors by revenue directly from the consolidated data
                    topDoctors.slice(0, 10)
                    : 
                    // Use the top 10 business units by revenue directly from the consolidated data
                    topBusinesses.slice(0, 10)
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="provider" interval={0} angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
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
                    name="Total Revenue" 
                    fill={COLORS.revenue}
                  />
                  <Bar 
                    dataKey="otherExpenses"
                    name="Total Operating Expenses" 
                    fill={COLORS.expenses} 
                    stackId="expenses" 
                  />
                  <Bar 
                    dataKey="payroll"
                    name="Total Payroll and Related Expense" 
                    fill={selectedView === 'doctors' ? COLORS.payrollDoctor : COLORS.payrollBusiness} 
                    stackId="expenses" 
                  />
                  <Bar 
                    dataKey="netIncome" 
                    name="Net Income" 
                    fill={COLORS.netIncome}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeepAnalysis;