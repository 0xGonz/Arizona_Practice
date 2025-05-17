import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/data-store";
import UploadBanner from "@/components/upload/upload-banner";
import { FileUp, BarChart3, TrendingUp, Users, Building2 } from "lucide-react";

export default function Dashboard() {
  const { uploadStatus } = useStore();
  const [activeSection, setActiveSection] = useState<string>("summary");
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark">Arizona Practice Platform</h1>
      </div>
      
      {!uploadStatus.annual && (
        <UploadBanner
          title="Welcome to Arizona Practice"
          message="Please upload your financial data files to begin analyzing your practice performance."
          buttonText="Upload Data Files"
          uploadType="annual"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <a 
          href="/upload" 
          className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <FileUp className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Upload Data</h3>
          <p className="text-sm text-gray-500">Import and manage your CSV financial files</p>
        </a>

        <a 
          href="/doctor-performance" 
          className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Provider Analytics</h3>
          <p className="text-sm text-gray-500">Analyze provider performance and profitability</p>
        </a>

        <a 
          href="/department-analysis" 
          className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Department Analysis</h3>
          <p className="text-sm text-gray-500">Track department metrics and growth</p>
        </a>

        <a 
          href="/monthly" 
          className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Monthly Analytics</h3>
          <p className="text-sm text-gray-500">View monthly financial performance</p>
        </a>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Getting Started with Arizona Practice</h2>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-medium">1</span>
            </div>
            <div>
              <h3 className="font-medium">Upload Data Files</h3>
              <p className="text-sm text-gray-500">Start by uploading your annual consolidated CSV and monthly E/O files</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-medium">2</span>
            </div>
            <div>
              <h3 className="font-medium">View Provider Analytics</h3>
              <p className="text-sm text-gray-500">Analyze provider performance, productivity, and profitability</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-medium">3</span>
            </div>
            <div>
              <h3 className="font-medium">Review Department Metrics</h3>
              <p className="text-sm text-gray-500">Evaluate department financial performance and trends</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-medium">4</span>
            </div>
            <div>
              <h3 className="font-medium">Track Monthly Performance</h3>
              <p className="text-sm text-gray-500">Monitor financial trends and metrics on a monthly basis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}