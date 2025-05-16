import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Upload, Download, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KPICard from "@/components/dashboard/kpi-card";
import NetMarginChart from "@/components/dashboard/net-margin-chart";
import RevenueMixChart from "@/components/dashboard/revenue-mix-chart";
import MonthlySummaryCard from "@/components/dashboard/monthly-summary-card";
import AncillaryRoiCard from "@/components/dashboard/ancillary-roi-card";
import UploadBanner from "@/components/upload/upload-banner";
import MonthlyTabs from "@/components/monthly/monthly-tabs";
import { useStore } from "@/store/data-store";
import { KPIData, RevenueMixItem, PerformerData, ComparisonData, MarginTrendPoint } from "@/types";
import { parseFinancialValue } from "@/lib/csv-parser";
import { extractMonthlySummaryData } from "@/lib/performance-utils";

export default function Dashboard() {
  // Get data directly from the global store
  const { 
    uploadStatus, 
    annualData,
    monthlyData,
    revenueMix, 
    marginTrend,
    topPerformers,
    bottomPerformers,
    ancillaryComparison
  } = useStore();
  
  const [dateRange, setDateRange] = useState<string>("year");
  
  // KPI data for dashboard display
  const [kpiData, setKpiData] = useState<KPIData>({
    totalRevenue: { value: 0, change: 0 },
    totalExpenses: { value: 0, change: 0 },
    netIncome: { value: 0, change: 0 }
  });
  
  // Calculate KPIs from annual data
  useEffect(() => {
    if (annualData && Array.isArray(annualData) && annualData.length > 0) {
      console.log("Calculating KPIs from annual data:", annualData.length, "rows");
      
      try {
        // Find revenue row
        const revenueRow = annualData.find(row => 
          row['Line Item'] && row['Line Item'].includes('Total Revenue')
        );
        
        // Find expense row
        const expenseRow = annualData.find(row => 
          row['Line Item'] && (
            row['Line Item'].includes('Total Expense') || 
            row['Line Item'].includes('Total Operating Expenses')
          )
        );
        
        const newKpiData = {...kpiData};
        
        if (revenueRow && revenueRow['Total']) {
          try {
            const totalRevenue = parseFinancialValue(revenueRow['Total']);
            newKpiData.totalRevenue.value = totalRevenue;
            newKpiData.totalRevenue.change = 5.2; // Sample change value
          } catch (e) {
            console.error("Error parsing revenue value:", e);
          }
        }
        
        if (expenseRow && expenseRow['Total']) {
          try {
            const totalExpenses = parseFinancialValue(expenseRow['Total']);
            newKpiData.totalExpenses.value = totalExpenses;
            newKpiData.totalExpenses.change = 3.8; // Sample change value
          } catch (e) {
            console.error("Error parsing expense value:", e);
          }
        }
        
        // Find the net income row directly from the data
        const incomeRow = annualData.find(row => 
          row['Line Item'] && (
            row['Line Item'].includes('Net Income') || 
            row['Line Item'].includes('Net Profit')
          )
        );
        
        // If we have a specific net income row, use that value
        if (incomeRow && incomeRow['Total']) {
          try {
            const netIncome = parseFinancialValue(incomeRow['Total']);
            newKpiData.netIncome.value = netIncome;
          } catch (e) {
            console.error("Error parsing net income value:", e);
            // Fall back to calculating from revenue and expenses
            newKpiData.netIncome.value = newKpiData.totalRevenue.value - newKpiData.totalExpenses.value;
          }
        } else {
          // Calculate net income from revenue and expenses if no specific row exists
          newKpiData.netIncome.value = newKpiData.totalRevenue.value - newKpiData.totalExpenses.value;
        }
        
        // Calculate actual percentage change if we have historical data
        if (incomeRow) {
          const priorYearCol = Object.keys(incomeRow).find(key => 
            key.toLowerCase().includes('prior') || 
            key.toLowerCase().includes('previous') ||
            key.includes('PY')
          );
          
          if (priorYearCol && incomeRow[priorYearCol]) {
            try {
              const priorNetIncome = parseFinancialValue(incomeRow[priorYearCol]);
              if (priorNetIncome !== 0) {
                newKpiData.netIncome.change = ((newKpiData.netIncome.value - priorNetIncome) / Math.abs(priorNetIncome)) * 100;
              } else {
                newKpiData.netIncome.change = newKpiData.netIncome.value > 0 ? 100 : -100;
              }
            } catch (e) {
              console.error("Error calculating net income change:", e);
              newKpiData.netIncome.change = 0;
            }
          } else {
            newKpiData.netIncome.change = 0;
          }
        } else {
          newKpiData.netIncome.change = 0;
        }
        
        setKpiData(newKpiData);
      } catch (error) {
        console.error("Error processing KPI data:", error);
      }
    }
  }, [annualData]);
  
  // Log when dashboard data updates
  useEffect(() => {
    if (uploadStatus.annual) {
      console.log("Dashboard data updated:");
      console.log("- Revenue Mix:", revenueMix?.length || 0, "items");
      console.log("- Margin Trend:", marginTrend?.length || 0, "points");
      console.log("- Top Performers:", topPerformers?.length || 0, "items");
      console.log("- Bottom Performers:", bottomPerformers?.length || 0, "items");
    }
  }, [uploadStatus.annual, revenueMix, marginTrend, topPerformers, bottomPerformers]);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark mb-1">Annual Financial Overview</h1>
          <p className="text-neutral-text">Year-to-date financial performance metrics</p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Year 2024" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year">Year 2024</SelectItem>
              <SelectItem value="q1">Q1 2024</SelectItem>
              <SelectItem value="q2">Q2 2024</SelectItem>
              <SelectItem value="q3">Q3 2024</SelectItem>
              <SelectItem value="q4">Q4 2024</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="bg-white">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button onClick={() => window.location.href = "/upload"}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Data
          </Button>
        </div>
      </div>

      {!uploadStatus.annual && (
        <UploadBanner 
          title="Annual Data Upload Required"
          message="Please upload the Annual Consolidated CSV file to view year-to-date metrics and trends on the main dashboard."
          buttonText="Upload Annual Data"
          uploadType="annual"
        />
      )}

      {uploadStatus.annual && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <KPICard 
              title="Total Revenue"
              value={kpiData.totalRevenue.value}
              change={kpiData.totalRevenue.change}
            />
            <KPICard 
              title="Total Expenses"
              value={kpiData.totalExpenses.value}
              change={kpiData.totalExpenses.change}
            />
            <KPICard 
              title="Net Income"
              value={kpiData.netIncome.value}
              change={kpiData.netIncome.change}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <NetMarginChart data={marginTrend || []} />
            <RevenueMixChart data={revenueMix || []} />
          </div>

          {/* Monthly Summary Data and Ancillary ROI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Process and display monthly data from E-files (Employee/Provider) */}
            {(() => {
              const monthlySummary = extractMonthlySummaryData(monthlyData);
              return (
                <MonthlySummaryCard 
                  title="Provider Financial Summary"
                  fileType="e"
                  totalRevenue={monthlySummary?.e?.totalRevenue || 0}
                  totalExpenses={monthlySummary?.e?.totalExpenses || 0}
                  netIncome={monthlySummary?.e?.netIncome || 0}
                  monthlyBreakdown={monthlySummary?.e?.monthlyBreakdown || []}
                />
              );
            })()}
            
            {/* Process and display monthly data from O-files (Other Business) */}
            {(() => {
              const monthlySummary = extractMonthlySummaryData(monthlyData);
              return (
                <MonthlySummaryCard 
                  title="Department Financial Summary"
                  fileType="o"
                  totalRevenue={monthlySummary?.o?.totalRevenue || 0}
                  totalExpenses={monthlySummary?.o?.totalExpenses || 0}
                  netIncome={monthlySummary?.o?.netIncome || 0}
                  monthlyBreakdown={monthlySummary?.o?.monthlyBreakdown || []}
                />
              );
            })()}
            
            <AncillaryRoiCard 
              comparisonData={ancillaryComparison || []}
              ancillaryMetrics={{
                revenue: ancillaryComparison && ancillaryComparison[0] ? ancillaryComparison[0].ancillary : 0,
                expenses: ancillaryComparison && ancillaryComparison[1] ? ancillaryComparison[1].ancillary : 0,
                profitMargin: 25.4, // Example value
                roi: 18.9  // Example value
              }}
            />
          </div>
        </>
      )}

      {/* Monthly Tabs */}
      <MonthlyTabs />
    </div>
  );
}