import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadBanner from "@/components/upload/upload-banner";
import { useStore } from "@/store/data-store";
import { User, Building } from "lucide-react";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MonthlyTabs() {
  const { uploadStatus } = useStore();
  const [activeMonth, setActiveMonth] = useState("January");

  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6">
      <div className="border-b border-neutral-border">
        <div className="flex overflow-x-auto scrollbar-hide">
          {months.map((month) => {
            const monthlyStatus = uploadStatus.monthly[month.toLowerCase()];
            const isActive = activeMonth === month;
            const isDisabled = !monthlyStatus?.e && !monthlyStatus?.o;
            
            return (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                disabled={isDisabled}
                className={`px-6 py-4 whitespace-nowrap ${
                  isActive 
                    ? "text-primary border-b-2 border-primary font-medium" 
                    : "text-neutral-text hover:text-neutral-dark"
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-6">
        {(() => {
          const monthlyStatus = uploadStatus.monthly[activeMonth.toLowerCase()];
          const eUploaded = !!monthlyStatus?.e;
          const oUploaded = !!monthlyStatus?.o;
          const allUploaded = eUploaded && oUploaded;
          
          if (!allUploaded) {
            return (
              <UploadBanner
                title={`${activeMonth} Data Upload Required`}
                message={`Please upload both the Employee (E) and Other Businesses (O) CSV files for ${activeMonth} to view detailed performance metrics.`}
                buttonText=""
                uploadType="monthly"
                month={activeMonth.toLowerCase()}
                showEOButtons={true}
                eUploaded={eUploaded}
                oUploaded={oUploaded}
              />
            );
          }
          
          // If both files are uploaded, show links to performance pages
          return (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-neutral-dark mb-4">Available {activeMonth} Reports</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a 
                  href="/doctor-performance" 
                  className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Doctor Performance</div>
                    <div className="text-sm text-gray-500">View provider metrics</div>
                  </div>
                </a>
                
                <a 
                  href="/department-analysis" 
                  className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Department Analysis</div>
                    <div className="text-sm text-gray-500">View department metrics</div>
                  </div>
                </a>
              </div>
            </div>
          );
        })()}
      </div>
    </Card>
  );
}
