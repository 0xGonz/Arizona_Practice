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
      // This would be where we process the annualData to set all state variables
      // For now, using placeholder data that matches the design
      
      setKpiData({
        totalRevenue: { value: 3452780, change: 7.2 },
        totalExpenses: { value: 2764250, change: -3.1 },
        netIncome: { value: 688530, change: 14.5 }
      });
      
      setRevenueMix([
        { name: 'Professional Fees', value: 2105380, color: '#42A5F5' },
        { name: 'Ancillary Income', value: 968210, color: '#66BB6A' },
        { name: 'Facility Fees', value: 245750, color: '#FFA726' },
        { name: 'Other Revenue', value: 133440, color: '#EF5350' }
      ]);
      
      setTopPerformers([
        { id: '1', name: 'Dr. Jennifer Smith', value: 157640, percentage: 95, initials: 'JS' },
        { id: '2', name: 'Dr. Robert Johnson', value: 142835, percentage: 85, initials: 'RJ' },
        { id: '3', name: 'Dr. Maria Chen', value: 128950, percentage: 75, initials: 'MC' },
        { id: '4', name: 'Dr. David Williams', value: 117320, percentage: 68, initials: 'DW' },
        { id: '5', name: 'Dr. Alex Peterson', value: 102785, percentage: 60, initials: 'AP' }
      ]);
      
      setBottomPerformers([
        { id: '1', name: 'Geriatric Practice', value: -42580, percentage: 85, initials: 'GP' },
        { id: '2', name: 'Physical Therapy', value: -31240, percentage: 70, initials: 'PT' },
        { id: '3', name: 'Dermatology Suite', value: -28950, percentage: 65, initials: 'DS' },
        { id: '4', name: 'Radiology Lab', value: -24720, percentage: 55, initials: 'RL' },
        { id: '5', name: 'Nephrology Practice', value: -18340, percentage: 40, initials: 'NP' }
      ]);
      
      setMarginTrend([
        { month: 'Jan', value: 18.2 },
        { month: 'Feb', value: 17.8 },
        { month: 'Mar', value: 19.5 },
        { month: 'Apr', value: 20.1 },
        { month: 'May', value: 22.4 },
        { month: 'Jun', value: 21.9 },
        { month: 'Jul', value: 23.2 },
        { month: 'Aug', value: 22.8 },
        { month: 'Sep', value: 21.5 },
        { month: 'Oct', value: 20.9 },
        { month: 'Nov', value: 19.8 },
        { month: 'Dec', value: 20.5 }
      ]);
      
      setComparisonData([
        { category: 'Revenue', professional: 2484570, ancillary: 968210 },
        { category: 'Expenses', professional: 1925680, ancillary: 425180 },
        { category: 'Net Income', professional: 558890, ancillary: 543030 }
      ]);
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
          
          <Button>
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
              icon="payments"
            />
            <KPICard 
              title="Total Expenses"
              value={kpiData.totalExpenses.value}
              change={kpiData.totalExpenses.change}
              icon="account_balance_wallet"
            />
            <KPICard 
              title="Net Income"
              value={kpiData.netIncome.value}
              change={kpiData.netIncome.change}
              icon="trending_up"
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
                revenue: 968210,
                expenses: 425180,
                profitMargin: 56.1,
                roi: 128
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
