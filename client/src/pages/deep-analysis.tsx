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
          const payroll = getProviderPayroll(month, provider, 'e');
          const netIncome = getProviderNetIncome(month, provider, 'e');
          // For total expenses, we use the difference between revenue and net income
          const calculatedExpenses = revenue - netIncome > 0 ? revenue - netIncome : payroll;
          console.log(`Found payroll for provider ${provider} in ${month}: ${payroll}`);
          
          // Calculate profit margin percentage
          const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
          // Calculate what percentage of expenses is payroll
          const payrollPercentage = calculatedExpenses > 0 ? (payroll / calculatedExpenses) * 100 : 0;
          
          doctorData.push({
            provider,
            revenue,
            expenses: calculatedExpenses,
            netIncome,
            payroll,
            otherExpenses: calculatedExpenses - payroll,
            profitMargin,
            payrollPercentage,
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
          const payroll = getProviderPayroll(month, provider, 'o');
          const netIncome = getProviderNetIncome(month, provider, 'o');
          // For total expenses, we use the difference between revenue and net income
          const calculatedExpenses = revenue - netIncome > 0 ? revenue - netIncome : payroll;
          console.log(`Found payroll for business provider ${provider} in ${month}: ${payroll}`);
          
          // Calculate profit margin percentage
          const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
          // Calculate what percentage of expenses is payroll
          const payrollPercentage = calculatedExpenses > 0 ? (payroll / calculatedExpenses) * 100 : 0;
          
          businessData.push({
            provider,
            revenue,
            expenses: calculatedExpenses,
            netIncome,
            payroll,
            otherExpenses: calculatedExpenses - payroll,
            profitMargin,
            payrollPercentage,
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
    // Debug available business units
    console.log("All business providers:", providerData.businessData.map(b => b.provider));
    
    // Create a mapping of standardized business unit names to their possible variations in CSV files
    const businessNameMappings = {
      'MedShip': ['medship', 'med ship', 'medship,inc', 'med-ship'],
      'Therapy, Physical': ['therapy', 'physical', 'therapy physical', 'physical therapy'],
      'Imaging': ['imaging', 'image', 'img'],
      'Pharmacy': ['pharmacy', 'pharm', 'rx', 'pharma'],
      'MRI': ['mri', 'm.r.i.', 'magnetic'],
      'DME': ['dme', 'd.m.e.', 'durable', 'equipment'],
      'NXT STIM': ['nxt', 'stim', 'nxtstim', 'nxt-stim'],
      'UDA': ['uda', 'u.d.a.', 'urgent', 'urgent delivery'],
      'Procedure Charges': ['procedure', 'procedures', 'proc', 'charges'],
      'ProMed': ['promed', 'pro med', 'pro-med', 'prof med']
    };
    
    // Function to standardize business names
    const standardizeBusinessName = (name) => {
      const nameLower = name.toLowerCase();
      
      for (const [standard, variations] of Object.entries(businessNameMappings)) {
        if (variations.some(v => nameLower.includes(v))) {
          return standard;
        }
      }
      
      // If no match found, return the original name
      return name;
    };
    
    // First standardize all business names
    const standardizedBusinessData = providerData.businessData.map(business => ({
      ...business,
      originalName: business.provider,
      provider: standardizeBusinessName(business.provider)
    }));
    
    // Log standardized names for debugging
    console.log("Standardized business names:", standardizedBusinessData.map(b => 
      `${b.originalName} -> ${b.provider}`
    ));
    
    // Group businesses by standardized name and sum their metrics
    const businessMap = new Map();
    standardizedBusinessData.forEach(business => {
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
    
    // The standard list of business units we want to display
    const requiredBusinessUnits = Object.keys(businessNameMappings);
    
    // Debug what we found after standardization
    console.log("Found business units after standardization:", 
      Array.from(businessMap.keys()).join(', ')
    );
    
    // Create the final array with all required business units
    return requiredBusinessUnits.map(unitName => {
      // If we have data for this unit, use it
      if (businessMap.has(unitName)) {
        return businessMap.get(unitName);
      }
      // Otherwise create placeholder with zero values
      return {
        provider: unitName,
        revenue: 0,
        expenses: 0,
        netIncome: 0,
        payroll: 0,
        otherExpenses: 0,
        profitMargin: 0,
        count: 0
      };
    });
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
        
        // Find the 'Total Revenue' line item - EXACT match
        const totalRevenueLine = eData.lineItems.find(
          item => item.name === 'Total Revenue'
        );
        if (totalRevenueLine) {
          doctorRevenue = Math.abs(totalRevenueLine.summaryValue || totalRevenueLine.total || 0);
          console.log(`Found Revenue for E data in ${month}: ${doctorRevenue}`);
        }
        
        // Find the 'Total Operating Expenses' line item - EXACT match
        const totalExpensesLine = eData.lineItems.find(
          item => item.name === 'Total Operating Expenses'
        );
        if (totalExpensesLine) {
          doctorExpenses = Math.abs(totalExpensesLine.summaryValue || totalExpensesLine.total || 0);
          console.log(`Found Expenses for E data in ${month}: ${doctorExpenses}`);
        }
        
        // Find the 'Net Income' line item - EXACT match
        const netIncomeLine = eData.lineItems.find(
          item => item.name === 'Net Income'
        );
        if (netIncomeLine) {
          doctorNetIncome = Math.abs(netIncomeLine.summaryValue || netIncomeLine.total || 0);
          console.log(`Found Net Income for E data in ${month}: ${doctorNetIncome}`);
        } else {
          // Only as fallback - calculate it
          doctorNetIncome = doctorRevenue - doctorExpenses;
          console.log(`Warning: 'Net Income' not found in E file for ${month}`);
          console.log(`Calculated Net Income for E data in ${month}: ${doctorNetIncome} (Revenue ${doctorRevenue} - Expenses ${doctorExpenses})`);
        }

        // Find the 'Total Payroll and Related Expenses' line item - expanded pattern matching
        const payrollLine = eData.lineItems.find(
          item => item.name === "Total Payroll and Related Expenses" || 
                 item.name === "Total Payroll & Related Expenses" ||
                 item.name === "Total Payroll and Related Expense" || 
                 item.name === "Total Payroll & Related Expense" ||
                 (item.name.toLowerCase().includes("total") && 
                  item.name.toLowerCase().includes("payroll") && 
                  item.name.toLowerCase().includes("related"))
        );
        if (payrollLine) {
          doctorPayroll = Math.abs(payrollLine.summaryValue || payrollLine.total || 0);
          console.log(`Found E Payroll expense in ${month}: ${doctorPayroll} from line item '${payrollLine.name}'`);
        } else {
          // Try to find any payroll-related line item as a fallback
          const anyPayrollLine = eData.lineItems.find(
            item => item.name.toLowerCase().includes("payroll")
          );
          if (anyPayrollLine) {
            doctorPayroll = Math.abs(anyPayrollLine.summaryValue || anyPayrollLine.total || 0);
            console.log(`Found fallback E Payroll expense in ${month}: ${doctorPayroll} from line item '${anyPayrollLine.name}'`);
          } else {
            console.log(`No payroll line found in E file for ${month}`);
          }
        }
        
        console.log(`Found Revenue for E data in ${month}: ${doctorRevenue}`);
        console.log(`Found Expenses for E data in ${month}: ${doctorExpenses}`);
        console.log(`Found Net Income for E data in ${month}: ${doctorNetIncome}`);
      }
      
      // Get O file metrics (business)
      if (monthData?.o) {
        const oData = monthData.o;
        
        console.log(`O file total line items for ${month}:`, oData.lineItems.map(i => i.name));
        
        // Find the 'Total Revenue' line item - EXACT match
        const totalRevenueLine = oData.lineItems.find(
          item => item.name === 'Total Revenue'
        );
        if (totalRevenueLine) {
          businessRevenue = Math.abs(totalRevenueLine.summaryValue || totalRevenueLine.total || 0);
          console.log(`Found Revenue for O data in ${month}: ${businessRevenue}`);
        }
        
        // Find the 'Total Operating Expenses' line item - EXACT match
        const totalExpensesLine = oData.lineItems.find(
          item => item.name === 'Total Operating Expenses'
        );
        if (totalExpensesLine) {
          businessExpenses = Math.abs(totalExpensesLine.summaryValue || totalExpensesLine.total || 0);
          console.log(`Found Expenses for O data in ${month}: ${businessExpenses}`);
        }
        
        // Find the 'Net Income' line item - EXACT match
        const netIncomeLine = oData.lineItems.find(
          item => item.name === 'Net Income'
        );
        if (netIncomeLine) {
          businessNetIncome = Math.abs(netIncomeLine.summaryValue || netIncomeLine.total || 0);
          console.log(`Found Net Income for O data in ${month}: ${businessNetIncome}`);
        } else {
          // Only as fallback - calculate it
          businessNetIncome = businessRevenue - businessExpenses;
          console.log(`Warning: 'Net Income' not found in O file for ${month}`);
        }

        // Find the 'Total Payroll and Related Expenses' line item - expanded pattern matching
        const payrollLine = oData.lineItems.find(
          item => item.name === "Total Payroll and Related Expenses" || 
                 item.name === "Total Payroll & Related Expenses" ||
                 item.name === "Total Payroll and Related Expense" || 
                 item.name === "Total Payroll & Related Expense" ||
                 (item.name.toLowerCase().includes("total") && 
                  item.name.toLowerCase().includes("payroll") && 
                  item.name.toLowerCase().includes("related"))
        );
        if (payrollLine) {
          businessPayroll = Math.abs(payrollLine.summaryValue || payrollLine.total || 0);
          console.log(`Found O Payroll expense in ${month}: ${businessPayroll} from line item '${payrollLine.name}'`);
        } else {
          // Try to find any payroll-related line item as a fallback
          const anyPayrollLine = oData.lineItems.find(
            item => item.name.toLowerCase().includes("payroll")
          );
          if (anyPayrollLine) {
            businessPayroll = Math.abs(anyPayrollLine.summaryValue || anyPayrollLine.total || 0);
            console.log(`Found fallback O Payroll expense in ${month}: ${businessPayroll} from line item '${anyPayrollLine.name}'`);
          } else {
            console.log(`No payroll line found in O file for ${month}`);
          }
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
      
      // Calculate other expenses (non-payroll) to create stacked bar chart
      const doctorOtherExpenses = doctorExpenses - doctorPayroll;
      const businessOtherExpenses = businessExpenses - businessPayroll;
      const totalOtherExpenses = totalExpenses - totalPayroll;
      
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
        doctorOtherExpenses,
        businessRevenue,
        businessExpenses,
        businessNetIncome,
        businessProfitMargin,
        businessPayroll,
        businessPayrollPercent,
        businessOtherExpenses,
        totalRevenue,
        totalExpenses,
        totalNetIncome,
        totalProfitMargin,
        totalPayroll,
        totalPayrollPercent,
        totalOtherExpenses
      };
    });
  }, [monthlyData, availableMonths]);

  // Define chart colors for consistency
  const COLORS = {
    revenue: '#4CAF50', // Green for revenue
    expenses: '#FF5722', // Orange/Red for expenses
    netIncome: '#FFC107', // Yellow/Gold for net income
    doctor: '#9C27B0', // Purple for doctor data
    business: '#2196F3', // Blue for business data
    payroll: '#F44336', // Red for payroll
    payrollDoctor: '#E91E63', // Pink for doctor payroll
    payrollBusiness: '#673AB7', // Deep Purple for business payroll
    expensesDoctor: '#FF9E80', // Light orange for doctor expenses
    expensesBusiness: '#81D4FA' // Light blue for business expenses
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
                      if (typeof name === 'string' && (name.includes('ProfitMargin') || name.includes('PayrollPercent'))) {
                        return [`${Number(value).toFixed(1)}%`, typeof name === 'string' ? name.replace(/([A-Z])/g, ' $1').trim() : name];
                      }
                      return [formatCurrency(value as number), typeof name === 'string' ? name.replace(/([A-Z])/g, ' $1').trim() : name];
                    }}
                  />
                  <Legend formatter={(value) => typeof value === 'string' ? value.replace(/([A-Z])/g, ' $1').trim() : String(value)} />
                  
                  {/* Revenue Bar - Direct from CSV */}
                  <Bar
                    dataKey={
                      dataView === 'doctor' ? 'doctorRevenue' : 
                      dataView === 'business' ? 'businessRevenue' : 'totalRevenue'
                    }
                    name={
                      dataView === 'doctor' ? 'Total Revenue (E)' : 
                      dataView === 'business' ? 'Total Revenue (O)' : 'Total Revenue'
                    }
                    fill={COLORS.revenue}
                    yAxisId="left"
                  />
                  
                  {/* Operating Expenses Bar Stack */}
                  <Bar
                    dataKey={
                      dataView === 'doctor' ? 'doctorOtherExpenses' : 
                      dataView === 'business' ? 'businessOtherExpenses' : 'totalOtherExpenses'
                    }
                    name={
                      dataView === 'doctor' ? 'Total Operating Expenses (E)' : 
                      dataView === 'business' ? 'Total Operating Expenses (O)' : 'Total Operating Expenses'
                    }
                    fill={
                      dataView === 'doctor' ? COLORS.expensesDoctor : 
                      dataView === 'business' ? COLORS.expensesBusiness : COLORS.expenses
                    }
                    yAxisId="left"
                    stackId="expenses"
                  />
                  
                  {/* Payroll Bar - Stacked on top of Other Expenses */}
                  <Bar
                    dataKey={
                      dataView === 'doctor' ? 'doctorPayroll' : 
                      dataView === 'business' ? 'businessPayroll' : 'totalPayroll'
                    }
                    name={
                      dataView === 'doctor' ? 'Payroll (E)' : 
                      dataView === 'business' ? 'Payroll (O)' : 'Total Payroll'
                    }
                    fill={
                      dataView === 'doctor' ? COLORS.payrollDoctor : 
                      dataView === 'business' ? COLORS.payrollBusiness : COLORS.payroll
                    }
                    yAxisId="left"
                    stackId="expenses"
                  />
                  
                  {/* Net Income Line - Direct from CSV */}
                  <Line
                    type="monotone"
                    dataKey={
                      dataView === 'doctor' ? 'doctorNetIncome' : 
                      dataView === 'business' ? 'businessNetIncome' : 'totalNetIncome'
                    }
                    name={
                      dataView === 'doctor' ? 'Net Income (E)' : 
                      dataView === 'business' ? 'Net Income (O)' : 'Net Income'
                    }
                    stroke={COLORS.netIncome}
                    strokeWidth={3}
                    yAxisId="left"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Removed duplicate Other Expenses Bar */}
                  
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
                <ComposedChart
                  data={selectedView === 'doctors' ? 
                    // Filter for specific doctors from E files
                    topDoctors.filter(d => [
                      'Dr Heiner', 'Dr Noori', 'Dr Diep', 'Dr Anderson', 'Dr Killian', 
                      'Dr Wright', 'Barnes, James', 'Aggarwal, Nitish', 'Sitzer, Tiarra', "O'Haver"
                    ].includes(d.provider))
                    : 
                    // Use the preconfigured list of business units
                    // This will display all units even if some have no data
                    topBusinesses
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="provider" interval={0} angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => {
                      // Special handling for Operating Expenses - show both individual component and total
                      if (name === "Total Operating Expenses") {
                        // Calculate and show the full expenses (payroll + other expenses)
                        const payroll = props.payload.payroll || 0;
                        const totalExpenses = (value as number) + payroll;
                        return [formatCurrency(totalExpenses), "Total Operating Expenses (Full)"];
                      }
                      
                      // Normal formatting for other values
                      if (typeof name === 'string') {
                        if (name.includes('Revenue') || name.includes('Expenses') || 
                            name.includes('Payroll') || name.includes('Income')) 
                          return [formatCurrency(value as number), name];
                        if (name.includes('Margin')) return [`${(value as number).toFixed(1)}%`, name];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => selectedView === 'doctors' ? `Provider: ${label}` : `Business Unit: ${label}`}
                  />
                  <Legend />
                  
                  {/* Revenue Bar */}
                  <Bar 
                    dataKey="revenue" 
                    name="Total Revenue" 
                    fill={COLORS.revenue}
                    yAxisId="left"
                  />
                  
                  {/* Operating Expenses Bar Stack */}
                  <Bar 
                    dataKey="otherExpenses"
                    name="Total Operating Expenses" 
                    fill={selectedView === 'doctors' ? COLORS.expensesDoctor : COLORS.expensesBusiness}
                    yAxisId="left"
                    stackId="expenses" 
                  />
                  
                  {/* Payroll Bar - Stacked on top of Other Expenses */}
                  <Bar 
                    dataKey="payroll"
                    name="Total Payroll" 
                    fill={selectedView === 'doctors' ? COLORS.payrollDoctor : COLORS.payrollBusiness}
                    yAxisId="left" 
                    stackId="expenses" 
                  />
                  
                  {/* Net Income Line */}
                  <Line
                    type="monotone"
                    dataKey="netIncome" 
                    name="Net Income" 
                    stroke={COLORS.netIncome}
                    strokeWidth={3}
                    yAxisId="left"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Profit Margin Line */}
                  <Line
                    type="monotone"
                    dataKey="profitMargin"
                    name="Profit Margin %"
                    stroke={COLORS.doctor} // Using purple color from the doctor/E data in top chart
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
    </div>
  );
};

export default DeepAnalysis;