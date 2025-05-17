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

interface BusinessAnalysisProps {
  hideHeader?: boolean;
}

export default function BusinessAnalysis({ hideHeader = false }: BusinessAnalysisProps) {
  const { filters } = useAnalysisStore();
  
  // Get the selected month for API query parameters
  const selectedMonth = filters.selectedMonth || '';
  
  // Fetch monthly data for businesses
  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['/api/analytics/monthly', selectedMonth, 'business'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch business detail data if a business is selected
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['/api/analytics/business/detail', filters.selectedBusiness, selectedMonth],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!filters.selectedBusiness, // Only run query if business is selected
  });
  
  // Fetch business list for the dropdown
  const { data: businessList, isLoading: isBusinessListLoading } = useQuery({
    queryKey: ['/api/analytics/business/list'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
  
  // Get data from monthly uploads
  const { data: uploads } = useQuery({
    queryKey: ['/api/uploads'],
    staleTime: 5 * 60 * 1000,
  });
  
  // Prepare mock data for development
  const mockData = React.useMemo(() => {
    // This is just sample data for development - will be replaced with real API data
    return [
      { id: 1, name: 'Primary Care', revenue: 320000, expenses: 240000, net: 80000, margin: 25.0 },
      { id: 2, name: 'Cardiology', revenue: 480000, expenses: 300000, net: 180000, margin: 37.5 },
      { id: 3, name: 'Radiology', revenue: 410000, expenses: 285000, net: 125000, margin: 30.5 },
      { id: 4, name: 'Laboratory', revenue: 285000, expenses: 210000, net: 75000, margin: 26.3 },
      { id: 5, name: 'Physical Therapy', revenue: 180000, expenses: 115000, net: 65000, margin: 36.1 }
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
    if (filters.selectedBusiness) {
      // For single business, show margin trend across different metrics
      // This would typically come from the API
      return [
        { metric: 'Revenue', value: mockData[1].revenue },
        { metric: 'Expenses', value: mockData[1].expenses },
        { metric: 'Net', value: mockData[1].net },
        { metric: 'Margin %', value: mockData[1].margin }
      ];
    } else {
      // For all businesses, show comparison of net income
      return mockData.map(business => ({
        id: business.id,
        name: business.name,
        net: business.net
      }));
    }
  }, [mockData, filters.selectedBusiness]);
  
  // Determine loading state
  const isLoading = isMonthlyLoading || isDetailLoading;
  
  return (
    <div className="container px-4 md:px-6 py-6">
      <Helmet>
        <title>Business Line Analysis - Clinic Financial Dashboard</title>
        <meta name="description" content="Analyze financial performance of business lines and departments with interactive charts and filters" />
      </Helmet>
      
      {!hideHeader && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Business Analysis</h1>
          </div>
          
          {/* Analysis Tabs */}
          <AnalysisTabs />
        </>
      )}
      
      {/* Filters */}
      <FiltersBar entityType="business" />
      
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
          singleEntitySelected={!!filters.selectedBusiness}
          entityType="business"
          isLoading={isBusinessListLoading || isLoading}
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