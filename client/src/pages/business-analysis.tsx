import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
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
  
  // Format date range for API query parameters
  const fromDate = filters.range.from ? format(filters.range.from, 'yyyy-MM-dd') : undefined;
  const toDate = filters.range.to ? format(filters.range.to, 'yyyy-MM-dd') : undefined;
  
  // Fetch summary data
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['/api/analytics/business/summary', fromDate, toDate],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
  
  // Fetch business detail data if a business line is selected
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['/api/analytics/business/detail', filters.selectedBusiness, fromDate, toDate],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    enabled: !!filters.selectedBusiness, // Only run query if business is selected
  });
  
  // Fetch business list for the profitability chart
  const { data: businessList, isLoading: isBusinessListLoading } = useQuery({
    queryKey: ['/api/analytics/business/list'],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
  
  // Prepare KPI card data
  const kpiData = React.useMemo(() => {
    const data = filters.selectedBusiness && detailData ? detailData : summaryData;
    
    if (!data || data.length === 0) {
      return { revenue: 0, expense: 0, net: 0 };
    }
    
    // Sum up all values
    return data.reduce((acc, item) => ({
      revenue: acc.revenue + item.revenue,
      expense: acc.expense + item.expense,
      net: acc.net + item.net
    }), { revenue: 0, expense: 0, net: 0 });
  }, [summaryData, detailData, filters.selectedBusiness]);
  
  // Prepare profitability chart data
  const profitabilityData = React.useMemo(() => {
    if (filters.selectedBusiness && detailData) {
      // For single business, show margin trend
      return detailData.map(item => ({
        month: item.month,
        marginPct: item.marginPct || (item.revenue !== 0 ? (item.net / item.revenue) * 100 : 0)
      }));
    } else if (businessList && summaryData) {
      // For all businesses, show net contribution
      return businessList.map((business: any) => {
        // Find business data
        const businessData = Array.isArray(detailData) ? detailData : [];
        const totalNet = businessData.reduce((sum, item) => sum + (item.net || 0), 0);
        
        return {
          id: business.id,
          name: business.name,
          net: totalNet
        };
      });
    }
    
    return [];
  }, [businessList, summaryData, detailData, filters.selectedBusiness]);
  
  // Determine which data to show in the charts and table
  const displayData = filters.selectedBusiness && detailData ? detailData : summaryData;
  const isLoading = filters.selectedBusiness ? isDetailLoading : isSummaryLoading;
  
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
          data={displayData || []} 
          isLoading={isLoading} 
          title="Monthly Revenue vs Expenses" 
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
        data={displayData || []} 
        isLoading={isLoading} 
      />
    </div>
  );
}