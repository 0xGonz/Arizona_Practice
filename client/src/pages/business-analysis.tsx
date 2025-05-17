import { useState, useEffect } from 'react';
import { useBusinessSummary, useBusinessDetail } from '../hooks/useBusinessAnalysis';
import { useAnalysisStore } from '../store/analysis-store';
import { FiltersBar, KpiCard, MonthlyBarChart, ProfitabilityChart, AnalysisTable } from '../components/analysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export function BusinessAnalysis() {
  const [activeTab, setActiveTab] = useState("performance");
  const { businessId, getDateRange } = useAnalysisStore();
  const dateRange = getDateRange();
  
  // Fetch summary data for all business lines
  const { data: summaryData, isLoading: isLoadingSummary } = useBusinessSummary(dateRange);
  
  // Fetch detailed data for a specific business line when selected
  const { data: detailData, isLoading: isLoadingDetail } = useBusinessDetail(businessId, dateRange);
  
  // Reset tab when business changes
  useEffect(() => {
    setActiveTab("performance");
  }, [businessId]);

  // Extract payroll data for the payroll chart from business line data
  const payrollData = summaryData?.monthlyData?.map(item => ({
    month: item.month,
    revenue: item.revenue,
    payroll: item.expense, // Using expense as payroll for demonstration
    payrollPct: item.revenue > 0 ? (item.expense / item.revenue) * 100 : 0
  })) || [];

  // Format KPI data from summary or detail data
  const kpiData = {
    totalRevenue: (businessId ? detailData?.totals?.revenue : summaryData?.totals?.revenue) || 0,
    totalExpenses: (businessId ? detailData?.totals?.expense : summaryData?.totals?.expense) || 0,
    netIncome: (businessId ? detailData?.totals?.net : summaryData?.totals?.net) || 0,
    // If available, use previous period data for comparison
    prevRevenue: (businessId ? detailData?.previousPeriod?.revenue : summaryData?.previousPeriod?.revenue),
    prevExpenses: (businessId ? detailData?.previousPeriod?.expense : summaryData?.previousPeriod?.expense),
    prevNet: (businessId ? detailData?.previousPeriod?.net : summaryData?.previousPeriod?.net),
  };

  // Get the appropriate monthly data based on the selected filters
  const monthlyData = businessId ? detailData?.monthlyData : summaryData?.monthlyData;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Business Line Analysis</h1>
        <p className="text-gray-500 mt-2">
          Analyze revenue, expenses, and profitability by business line
        </p>
      </div>

      <FiltersBar mode="business" />
      
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {isLoadingSummary ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <KpiCard 
              title="Revenue" 
              value={kpiData.totalRevenue} 
              previousValue={kpiData.prevRevenue} 
              colorScheme="blue" 
            />
            <KpiCard 
              title="Expenses" 
              value={kpiData.totalExpenses} 
              previousValue={kpiData.prevExpenses} 
              colorScheme="red" 
            />
            <KpiCard 
              title="Net Income" 
              value={kpiData.netIncome} 
              previousValue={kpiData.prevNet} 
              colorScheme="green" 
            />
          </>
        )}
      </div>

      {/* Tabs for different analytical views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="profitability">Profitability Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          {isLoadingSummary ? (
            <Skeleton className="h-80 mb-6" />
          ) : (
            <MonthlyBarChart 
              data={monthlyData || []} 
              title={businessId ? "Monthly Performance" : "All Business Lines Performance"} 
            />
          )}
          
          {isLoadingSummary ? (
            <Skeleton className="h-80" />
          ) : (
            <AnalysisTable 
              data={monthlyData || []} 
              title={businessId ? "Monthly Detail" : "All Business Lines Summary"} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="profitability">
          {isLoadingSummary ? (
            <Skeleton className="h-80 mb-6" />
          ) : (
            <ProfitabilityChart 
              data={payrollData} 
              title="Revenue vs Operating Expenses" 
            />
          )}
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mt-6">
            <h3 className="text-lg font-medium mb-2">Profitability Insights</h3>
            <p className="text-gray-600 mb-4">
              This chart shows the relationship between revenue and operating expenses. 
              The line represents expenses as a percentage of revenue, a key metric for 
              understanding operational efficiency.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Industry benchmarks vary, but most profitable practices maintain operating expenses between 40-60% of revenue.</li>
              <li>Month-to-month variance may indicate seasonal effects or changes in business operations.</li>
              <li>Consistently high expense ratios may require evaluation of supply costs, staffing, or other operational factors.</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}