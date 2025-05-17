import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet';

import { FiltersBar } from '@/components/analysis/filters-bar';
import { KpiCards } from '@/components/analysis/kpi-cards';
import { MonthlyBarChart } from '@/components/analysis/monthly-bar-chart';
import { ProfitabilityChart } from '@/components/analysis/profitability-chart';
import { AnalysisTable } from '@/components/analysis/analysis-table';
import { useAnalysisStore } from '@/store/analysis-store';

export default function EmployeeAnalysis() {
  const { filters } = useAnalysisStore();
  
  // Format date range for API query parameters
  const fromDate = filters.range.from ? format(filters.range.from, 'yyyy-MM-dd') : undefined;
  const toDate = filters.range.to ? format(filters.range.to, 'yyyy-MM-dd') : undefined;
  
  // Fetch summary data
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['/api/analytics/employee/summary', fromDate, toDate],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
  
  // Fetch employee detail data if an employee is selected
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['/api/analytics/employee/detail', filters.selectedEmployee, fromDate, toDate],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    enabled: !!filters.selectedEmployee, // Only run query if employee is selected
  });
  
  // Fetch employee list for the profitability chart
  const { data: employeeList, isLoading: isEmployeeListLoading } = useQuery({
    queryKey: ['/api/analytics/employee/list'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
  
  // Prepare KPI card data
  const kpiData = React.useMemo(() => {
    const data = filters.selectedEmployee && detailData ? detailData : summaryData;
    
    if (!data || data.length === 0) {
      return { revenue: 0, expense: 0, net: 0 };
    }
    
    // Sum up all values
    return data.reduce((acc, item) => ({
      revenue: acc.revenue + item.revenue,
      expense: acc.expense + item.expense,
      net: acc.net + item.net
    }), { revenue: 0, expense: 0, net: 0 });
  }, [summaryData, detailData, filters.selectedEmployee]);
  
  // Prepare profitability chart data
  const profitabilityData = React.useMemo(() => {
    if (filters.selectedEmployee && detailData) {
      // For single employee, show margin trend
      return detailData.map(item => ({
        month: item.month,
        marginPct: item.marginPct || (item.revenue !== 0 ? (item.net / item.revenue) * 100 : 0)
      }));
    } else if (employeeList && summaryData) {
      // For all employees, show net contribution
      return employeeList.map((employee: any) => {
        // Find employee data across all months
        const employeeData = Array.isArray(detailData) ? detailData : [];
        const totalNet = employeeData.reduce((sum, item) => sum + (item.net || 0), 0);
        
        return {
          id: employee.id,
          name: employee.name,
          net: totalNet
        };
      });
    }
    
    return [];
  }, [employeeList, summaryData, detailData, filters.selectedEmployee]);
  
  // Determine which data to show in the charts and table
  const displayData = filters.selectedEmployee && detailData ? detailData : summaryData;
  const isLoading = filters.selectedEmployee ? isDetailLoading : isSummaryLoading;
  
  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Employee Analysis - Clinic Financial Dashboard</title>
        <meta name="description" content="Analyze financial performance of clinic employees with interactive charts and filters" />
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Analysis</h1>
      </div>
      
      {/* Filters */}
      <FiltersBar entityType="employee" />
      
      {/* KPI Cards */}
      <KpiCards data={kpiData} isLoading={isLoading} />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MonthlyBarChart 
          data={displayData || []} 
          isLoading={isLoading} 
          title="Monthly Revenue vs Expenses" 
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
        data={displayData || []} 
        isLoading={isLoading} 
      />
    </div>
  );
}