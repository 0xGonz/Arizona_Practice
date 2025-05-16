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

export default function Dashboard() {
  const { uploadStatus, annualData } = useStore();
  const [dateRange, setDateRange] = useState<string>("year");
  
  // KPI data (would normally come from processed CSV data)
  const [kpiData, setKpiData] = useState<KPIData>({
    totalRevenue: { value: 0, change: 0 },
    totalExpenses: { value: 0, change: 0 },
    netIncome: { value: 0, change: 0 }
  });

  // Example revenue mix data (would come from processed CSV)
  const [revenueMix, setRevenueMix] = useState<RevenueMixItem[]>([]);
  
  // Top performers data
  const [topPerformers, setTopPerformers] = useState<PerformerData[]>([]);
  
  // Bottom performers data
  const [bottomPerformers, setBottomPerformers] = useState<PerformerData[]>([]);
  
  // Net margin trend data
  const [marginTrend, setMarginTrend] = useState<MarginTrendPoint[]>([]);
  
  // Ancillary vs Professional comparison data
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);

  useEffect(() => {
    if (annualData) {
      // Process the annual data to extract real metrics
      try {
        // Reset to defaults first
        setKpiData({
          totalRevenue: { value: 0, change: 0 },
          totalExpenses: { value: 0, change: 0 },
          netIncome: { value: 0, change: 0 }
        });
        
        setRevenueMix([]);
        setTopPerformers([]);
        setBottomPerformers([]);
        setMarginTrend([]);
        setComparisonData([]);
        
        // When we have actual data from user uploads, we'll extract and set metrics here
        console.log("Annual data received, ready to process uploaded data");
        
        // The actual data processing would happen here using the uploaded annual CSV data
        // For example, if we have line items from the annual data:
        // const revenueLineItems = annualData.lineItems.filter(item => item.name.includes('Revenue'));
        // const expenseLineItems = annualData.lineItems.filter(item => item.name.includes('Expense'));
        
        // This will be populated with real data from CSV uploads
      } catch (error) {
        console.error("Error processing annual data:", error);
      }
    }
  }, [annualData]);

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
            <NetMarginChart data={marginTrend} />
            <RevenueMixChart data={revenueMix} />
          </div>

          {/* Top/Bottom Performers and Ancillary ROI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <PerformersCard 
              title="Top Performing Providers"
              performers={topPerformers}
              positiveValues={true}
            />
            <PerformersCard 
              title="Bottom Performing Units"
              performers={bottomPerformers}
              positiveValues={false}
            />
            <AncillaryRoiCard 
              comparisonData={comparisonData}
              ancillaryMetrics={{
                revenue: 0,
                expenses: 0,
                profitMargin: 0,
                roi: 0
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
