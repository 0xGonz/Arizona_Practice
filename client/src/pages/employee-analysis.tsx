import { useState, useEffect } from 'react';
import { useEmployeeSummary, useEmployeeDetail } from '../hooks/useEmployeeAnalysis';
import { useAnalysisStore } from '../store/analysis-store';
import { FiltersBar } from '../components/analysis/FiltersBar';
import { KpiCard } from '../components/analysis/KpiCard';
import { MonthlyBarChart } from '../components/analysis/MonthlyBarChart';
import { ProfitabilityChart } from '../components/analysis/ProfitabilityChart';
import { AnalysisTable } from '../components/analysis/AnalysisTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export function EmployeeAnalysis() {
  const [activeTab, setActiveTab] = useState("performance");
  const { employeeId, getDateRange } = useAnalysisStore();
  const dateRange = getDateRange();
  
  // Fetch summary data for all employees
  const { data: summaryData, isLoading: isLoadingSummary } = useEmployeeSummary(dateRange);
  
  // Fetch detailed data for a specific employee when selected
  const { data: detailData, isLoading: isLoadingDetail } = useEmployeeDetail(employeeId, dateRange);
  
  // Reset tab when employee changes
  useEffect(() => {
    setActiveTab("performance");
  }, [employeeId]);

  // Extract payroll data for the payroll chart from employee data
  const payrollData = summaryData?.monthlyData?.map(item => ({
    month: item.month,
    revenue: item.revenue,
    payroll: item.expense, // Using expense as payroll for demonstration
    payrollPct: item.revenue > 0 ? (item.expense / item.revenue) * 100 : 0
  })) || [];

  // Format KPI data from summary or detail data
  const kpiData = {
    totalRevenue: (employeeId ? detailData?.totals?.revenue : summaryData?.totals?.revenue) || 0,
    totalExpenses: (employeeId ? detailData?.totals?.expense : summaryData?.totals?.expense) || 0,
    netIncome: (employeeId ? detailData?.totals?.net : summaryData?.totals?.net) || 0,
    // If available, use previous period data for comparison
    prevRevenue: (employeeId ? detailData?.previousPeriod?.revenue : summaryData?.previousPeriod?.revenue),
    prevExpenses: (employeeId ? detailData?.previousPeriod?.expense : summaryData?.previousPeriod?.expense),
    prevNet: (employeeId ? detailData?.previousPeriod?.net : summaryData?.previousPeriod?.net),
  };

  // Get the appropriate monthly data based on the selected filters
  const monthlyData = employeeId ? detailData?.monthlyData : summaryData?.monthlyData;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Employee Analysis</h1>
        <p className="text-gray-500 mt-2">
          Analyze revenue, expenses, and profitability by employee
        </p>
      </div>

      <FiltersBar mode="employee" />
      
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
          <TabsTrigger value="payroll">Payroll Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          {isLoadingSummary ? (
            <Skeleton className="h-80 mb-6" />
          ) : (
            <MonthlyBarChart 
              data={monthlyData || []} 
              title={employeeId ? "Monthly Performance" : "All Employees Performance"} 
            />
          )}
          
          {isLoadingSummary ? (
            <Skeleton className="h-80" />
          ) : (
            <AnalysisTable 
              data={monthlyData || []} 
              title={employeeId ? "Monthly Detail" : "All Employees Summary"} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="payroll">
          {isLoadingSummary ? (
            <Skeleton className="h-80 mb-6" />
          ) : (
            <ProfitabilityChart 
              data={payrollData} 
              title="Revenue vs Payroll" 
            />
          )}
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mt-6">
            <h3 className="text-lg font-medium mb-2">Payroll Insights</h3>
            <p className="text-gray-600 mb-4">
              This chart shows the relationship between revenue and payroll expenses. 
              The line represents payroll as a percentage of revenue, which is a key metric for 
              understanding labor cost efficiency.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Ideal payroll percentage varies by practice type, but generally 40-60% is common.</li>
              <li>Month-to-month fluctuations may indicate staffing adjustments or revenue changes.</li>
              <li>Higher percentages in specific months may require investigation into scheduling or productivity issues.</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}