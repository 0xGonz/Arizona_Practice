import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FiltersBar } from '@/components/analysis/filters-bar';
import { MonthlyBarChart } from '@/components/analysis/monthly-bar-chart';
import { ProfitabilityChart } from '@/components/analysis/profitability-chart';
import { AnalysisTable } from '@/components/analysis/analysis-table';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Percent } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAnalysisStore } from '@/store/analysis-store';
import { useStore } from '@/store/data-store';

// Utility functions for formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

function FinancialAnalysis() {
  const [activeTab, setActiveTab] = useState<'employee' | 'business'>('employee');
  const { filters } = useAnalysisStore();
  const { monthlyData } = useStore();
  
  // Fetch employee data
  const { 
    data: employeeData = [],
    isLoading: isEmployeeLoading 
  } = useQuery({
    queryKey: ['/api/analytics/employee/summary', filters],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeTab === 'employee'
  });
  
  // Fetch business data
  const { 
    data: businessData = [],
    isLoading: isBusinessLoading 
  } = useQuery({
    queryKey: ['/api/analytics/business/summary', filters],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeTab === 'business'
  });
  
  // Extract entities from monthly data for each entity type
  const employeeEntities = React.useMemo(() => {
    const allEmployees = new Set<string>();
    
    // Loop through all months in the data
    Object.values(monthlyData || {}).forEach((month: any) => {
      if (month?.e?.entityColumns) {
        month.e.entityColumns.forEach((col: string) => {
          // Only add specific employee types
          if (col.includes('Dr ') || 
              ['Binder, William', 'Barnes, James', 'Samons, Anna', 'Vincent, Jason', 
               'Aggarwal, Nitish', "O'Haver", 'Sitzer, Tiarra'].includes(col)) {
            allEmployees.add(col);
          }
        });
      }
    });
    
    return Array.from(allEmployees).map(name => ({
      id: name,
      name: name
    }));
  }, [monthlyData]);
  
  // Extract business entities (departments) from monthly data
  const businessEntities = React.useMemo(() => {
    const allBusinesses = new Set<string>();
    
    // Loop through all months in the data
    Object.values(monthlyData || {}).forEach((month: any) => {
      if (month?.o?.entityColumns) {
        month.o.entityColumns.forEach((col: string) => {
          // Only add specific business types
          const businessTypes = [
            'CBD', 'Pharmacy', 'DME', 'Procedure Charges', 'Foothills Interest', 
            'Urgent Care', 'Imaging', 'IncrediWear', 'Massage Therapy', 'MedShip',
            'Mobile', 'MRI', 'NXT STIM', 'ProMed', 'Therapy', 'Physical', 'UDA'
          ];
          
          if (businessTypes.some(type => col.includes(type))) {
            allBusinesses.add(col);
          }
        });
      }
    });
    
    return Array.from(allBusinesses).map(name => ({
      id: name,
      name: name
    }));
  }, [monthlyData]);
  
  // Get monthly performance metrics
  const getMonthlyPerformance = (entityType: 'employee' | 'business') => {
    // If no date range is selected, use all available months
    const months = Object.keys(monthlyData || {});
    
    if (months.length === 0) return [];
    
    // Check which entity is selected
    const selectedId = entityType === 'employee' 
      ? filters.selectedEmployee 
      : filters.selectedBusiness;
    
    const monthlyPerformance = months.map(month => {
      const data = entityType === 'employee' 
        ? monthlyData[month]?.e 
        : monthlyData[month]?.o;
      
      if (!data) return null;
      
      // Find revenue and expenses in lineItems
      const totalRevenue = data.lineItems?.find((item: any) => 
        item.name === 'Total Revenue' && item.isTotal)?.entityValues?.[selectedId] || 0;
      
      const totalExpenses = data.lineItems?.find((item: any) => 
        item.name === 'Total Operating Expenses' && item.isTotal)?.entityValues?.[selectedId] || 0;
      
      const netIncome = data.lineItems?.find((item: any) => 
        item.name === 'Net Income (Loss)' && item.isTotal)?.entityValues?.[selectedId] || 0;
      
      return {
        month,
        revenue: Number(totalRevenue),
        expense: Number(totalExpenses),
        net: Number(netIncome),
        marginPct: totalRevenue ? (netIncome / totalRevenue) * 100 : 0
      };
    }).filter(Boolean);
    
    return monthlyPerformance;
  };
  
  // Calculate totals for KPIs
  const calculateTotals = (data: any[]) => {
    const totals = data.reduce((acc, item) => {
      return {
        revenue: acc.revenue + (Number(item.revenue) || 0),
        expenses: acc.expenses + (Number(item.expense) || 0),
        profit: acc.profit + (Number(item.net) || 0)
      };
    }, { revenue: 0, expenses: 0, profit: 0 });
    
    totals.margin = totals.revenue ? (totals.profit / totals.revenue) * 100 : 0;
    
    return totals;
  };
  
  // Get monthly performance data based on current tab
  const monthlyPerformance = activeTab === 'employee' 
    ? getMonthlyPerformance('employee')
    : getMonthlyPerformance('business');
  
  // Calculate KPI totals
  const kpiData = calculateTotals(monthlyPerformance);
  
  // Function to handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'employee' | 'business');
  };
  
  return (
    <>
      <Helmet>
        <title>Financial Analysis | Arizona Practice</title>
        <meta name="description" content="Analyze employee and business financial performance with interactive charts and detailed breakdowns." />
      </Helmet>
      
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Financial Analysis</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="employee">Employee Analysis</TabsTrigger>
            <TabsTrigger value="business">Business Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employee" className="space-y-6">
            <FiltersBar entityType="employee" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-dark">Total Revenue</h3>
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(kpiData.revenue)}</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-dark">Total Expenses</h3>
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(kpiData.expenses)}</p>
                </CardContent>
              </Card>
              
              <Card className={`border-l-4 ${kpiData.profit >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-dark">Net Income</h3>
                    {kpiData.profit > 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(kpiData.profit)}</p>
                </CardContent>
              </Card>
              
              <Card className={`border-l-4 ${kpiData.margin >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-dark">Profit Margin</h3>
                    <Percent className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatPercent(kpiData.margin)}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <MonthlyBarChart 
                data={monthlyPerformance} 
                isLoading={isEmployeeLoading} 
              />
              <ProfitabilityChart 
                data={monthlyPerformance}
                isLoading={isEmployeeLoading}
              />
            </div>
            
            <AnalysisTable 
              data={monthlyPerformance}
              entityType="employee" 
              isLoading={isEmployeeLoading}
            />
          </TabsContent>
          
          <TabsContent value="business" className="space-y-6">
            <FiltersBar entityType="business" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-dark">Total Revenue</h3>
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(kpiData.revenue)}</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-dark">Total Expenses</h3>
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(kpiData.expenses)}</p>
                </CardContent>
              </Card>
              
              <Card className={`border-l-4 ${kpiData.profit >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-dark">Net Income</h3>
                    {kpiData.profit > 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(kpiData.profit)}</p>
                </CardContent>
              </Card>
              
              <Card className={`border-l-4 ${kpiData.margin >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-dark">Profit Margin</h3>
                    <Percent className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatPercent(kpiData.margin)}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <MonthlyBarChart 
                data={monthlyPerformance} 
                isLoading={isBusinessLoading} 
              />
              <ProfitabilityChart 
                data={monthlyPerformance}
                isLoading={isBusinessLoading}
              />
            </div>
            
            <AnalysisTable 
              data={monthlyPerformance}
              entityType="business" 
              isLoading={isBusinessLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default FinancialAnalysis;