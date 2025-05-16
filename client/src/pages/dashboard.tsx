import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Upload, Download, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KPICard from "@/components/dashboard/kpi-card";
import NetMarginChart from "@/components/dashboard/net-margin-chart";
import RevenueMixChart from "@/components/dashboard/revenue-mix-chart";
import PerformersCard from "@/components/dashboard/performers-card";
import AncillaryRoiCard from "@/components/dashboard/ancillary-roi-card";
import UploadBanner from "@/components/upload/upload-banner";
import MonthlyTabs from "@/components/monthly/monthly-tabs";
import { useStore } from "@/store/data-store";
import { KPIData, RevenueMixItem, PerformerData, ComparisonData, MarginTrendPoint } from "@/types";
import { parseFinancialValue } from "@/lib/csv-parser";

export default function Dashboard() {
  // Get data directly from the global store
  const { 
    uploadStatus, 
    annualData, 
    revenueMix, 
    marginTrend,
    topPerformers,
    bottomPerformers,
    ancillaryComparison: comparisonData 
  } = useStore();
  
  const [dateRange, setDateRange] = useState<string>("year");
  
  // Calculate KPIs from annual data
  const [kpiData, setKpiData] = useState<KPIData>({
    totalRevenue: { value: 0, change: 0 },
    totalExpenses: { value: 0, change: 0 },
    netIncome: { value: 0, change: 0 }
  });
  
  // Process the annual data to extract KPI metrics
  useEffect(() => {
    if (annualData && Array.isArray(annualData) && annualData.length > 0) {
      console.log("Processing annual data for KPIs");
      
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
      
      const newKpiData = { ...kpiData };
      
      if (revenueRow && revenueRow['Total']) {
        try {
          // Use the parsing function from csv-parser to handle financial values properly
          const totalRevenue = typeof revenueRow['Total'] === 'string' ? 
            parseFinancialValue(revenueRow['Total']) : 0;
          
          newKpiData.totalRevenue.value = totalRevenue;
          newKpiData.totalRevenue.change = 5.2; // Sample change value
        } catch (error) {
          console.error("Error parsing revenue:", error);
        }
      }
      
      if (expenseRow && expenseRow['Total']) {
        try {
          const totalExpenses = typeof expenseRow['Total'] === 'string' ? 
            parseFinancialValue(expenseRow['Total']) : 0;
          
          newKpiData.totalExpenses.value = totalExpenses;
          newKpiData.totalExpenses.change = 3.8; // Sample change value
        } catch (error) {
          console.error("Error parsing expenses:", error);
        }
      }
      
      // Calculate net income
      newKpiData.netIncome.value = newKpiData.totalRevenue.value - newKpiData.totalExpenses.value;
      newKpiData.netIncome.change = 7.5; // Sample change value
      
      setKpiData(newKpiData);
    }
  }, [annualData]);

  // Debugging effect to monitor data changes
  useEffect(() => {
    if (annualData && Array.isArray(annualData) && annualData.length > 0) {
      console.log("Dashboard has received annual data from the store");
      console.log("Revenue Mix items:", revenueMix.length);
      console.log("Margin Trend points:", marginTrend.length);
      console.log("Top Performers:", topPerformers.length);
      console.log("Bottom Performers:", bottomPerformers.length);
    }
  }, [annualData, revenueMix, marginTrend, topPerformers, bottomPerformers]);

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
            <NetMarginChart data={marginTrend.length > 0 ? marginTrend : []} />
            <RevenueMixChart data={revenueMix.length > 0 ? revenueMix : []} />
          </div>

          {/* Top/Bottom Performers and Ancillary ROI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <PerformersCard 
              title="Top Performing Providers"
              performers={topPerformers.length > 0 ? topPerformers : []}
              positiveValues={true}
            />
            <PerformersCard 
              title="Bottom Performing Units"
              performers={bottomPerformers.length > 0 ? bottomPerformers : []}
              positiveValues={false}
            />
            <AncillaryRoiCard 
              comparisonData={comparisonData || []}
              ancillaryMetrics={{
                revenue: comparisonData && comparisonData[0] ? comparisonData[0].ancillary : 0,
                expenses: comparisonData && comparisonData[1] ? comparisonData[1].ancillary : 0,
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