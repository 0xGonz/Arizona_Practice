import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';

import { FiltersBar } from '@/components/analysis/filters-bar';
import { KpiCards } from '@/components/analysis/kpi-cards';
import { MonthlyBarChart } from '@/components/analysis/monthly-bar-chart';
import { ProfitabilityChart } from '@/components/analysis/profitability-chart';
import { AnalysisTable } from '@/components/analysis/analysis-table';
import { AnalysisTabs } from '@/components/analysis/analysis-tabs';
import { useAnalysisStore } from '@/store/analysis-store';

interface EmployeeAnalysisProps {
  hideHeader?: boolean;
}

export default function EmployeeAnalysis({ hideHeader = false }: EmployeeAnalysisProps) {
  const { filters } = useAnalysisStore();
  
  // Get the selected month for API query parameters
  const selectedMonth = filters.selectedMonth || '';
  
  // Fetch monthly data for employees
  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['/api/analytics/monthly', selectedMonth, 'employee'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch employee detail data if an employee is selected
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['/api/analytics/employee/detail', filters.selectedEmployee, selectedMonth],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!filters.selectedEmployee, // Only run query if employee is selected
  });
  
  // Fetch employee list for the dropdown
  const { data: employeeList, isLoading: isEmployeeListLoading } = useQuery({
    queryKey: ['/api/analytics/employee/list'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
  
  // Get sample data from monthly uploads
  const { data: uploads } = useQuery({
    queryKey: ['/api/uploads'],
    staleTime: 5 * 60 * 1000,
  });
  
  // Prepare mock data for development
  const mockData = React.useMemo(() => {
    // This is just sample data for development - will be replaced with real API data
    return [
      { id: 1, name: 'Dr. Smith', revenue: 45000, expenses: 20000, net: 25000, margin: 55.5 },
      { id: 2, name: 'Dr. Johnson', revenue: 52000, expenses: 28000, net: 24000, margin: 46.1 },
      { id: 3, name: 'Dr. Williams', revenue: 38000, expenses: 18000, net: 20000, margin: 52.6 },
      { id: 4, name: 'Dr. Brown', revenue: 41000, expenses: 24000, net: 17000, margin: 41.5 },
      { id: 5, name: 'Dr. Jones', revenue: 39000, expenses: 22000, net: 17000, margin: 43.6 }
    ];
  }, []);
  
  // Prepare KPI card data
  const kpiData = React.useMemo(() => {
    // Use mockData temporarily - will be replaced with real API data
    const totalRevenue = mockData.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpenses = mockData.reduce((sum, item) => sum + item.expenses, 0);
    const totalNet = mockData.reduce((sum, item) => sum + item.net, 0);
    
    return { 
      revenue: totalRevenue,
      expense: totalExpenses,
      net: totalNet
    };
  }, [mockData]);
  
  // Prepare profitability chart data
  const profitabilityData = React.useMemo(() => {
    if (filters.selectedEmployee) {
      // For single employee, show margin trend across different metrics
      // This would typically come from the API
      return [
        { metric: 'Revenue', value: mockData[0].revenue },
        { metric: 'Expenses', value: mockData[0].expenses },
        { metric: 'Net', value: mockData[0].net },
        { metric: 'Margin %', value: mockData[0].margin }
      ];
    } else {
      // For all employees, show comparison of net income
      return mockData.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        net: doctor.net
      }));
    }
  }, [mockData, filters.selectedEmployee]);
  
  // Determine loading state
  const isLoading = isMonthlyLoading || isDetailLoading;
  
  return (
    <div className="container px-4 md:px-6 py-6">
      <Helmet>
        <title>Employee Analysis - Clinic Financial Dashboard</title>
        <meta name="description" content="Analyze financial performance of clinic employees with interactive charts and filters" />
      </Helmet>
      
      {!hideHeader && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Employee Analysis</h1>
          </div>
          
          {/* Analysis Tabs */}
          <AnalysisTabs />
        </>
      )}
      
      {/* Filters */}
      <FiltersBar entityType="employee" />
      
      {/* KPI Cards */}
      <KpiCards data={kpiData} isLoading={isLoading} />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MonthlyBarChart 
          data={mockData} 
          isLoading={isLoading} 
          title="Revenue vs Expenses" 
        />
        
        <ProfitabilityChart 
          data={profitabilityData}
          singleEntitySelected={!!filters.selectedEmployee}
          entityType="employee"
          isLoading={isEmployeeListLoading || isLoading}
        />
      </div>
      
      {/* Data Table */}
      <AnalysisTable 
        data={mockData} 
        isLoading={isLoading} 
      />
    </div>
  );
}