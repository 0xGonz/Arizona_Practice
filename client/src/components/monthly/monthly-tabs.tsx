import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadBanner from "@/components/upload/upload-banner";
import { useStore } from "@/store/working-store";
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
      

    </Card>
  );
}
