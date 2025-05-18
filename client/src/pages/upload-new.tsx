import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/data-store";
import CSVUpload from "@/components/upload/csv-upload";
import { Trash2 } from "lucide-react";

export default function UploadNew() {
  const { uploadStatus, clearUploadedData } = useStore();
  const [selectedEMonth, setSelectedEMonth] = useState("january");
  const [selectedOMonth, setSelectedOMonth] = useState("january");
  
  // Handle clearing all data
  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear ALL uploaded data? This cannot be undone.")) {
      clearUploadedData('all');
    }
  };

  return (
    <div className="container mx-auto p-4 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground mt-1">Upload and manage CSV financial data</p>
        </div>
        
        <Button 
          variant="destructive" 
          className="mt-3 lg:mt-0 flex items-center gap-2"
          onClick={handleClearAllData}
        >
          <Trash2 size={16} />
          Clear All Data
        </Button>
      </div>
      
      <Tabs defaultValue="monthly">
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="monthly">Monthly Data</TabsTrigger>
          <TabsTrigger value="annual">Annual Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly E File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Employee (E) Files</CardTitle>
                <CardDescription>Upload monthly Employee CSV files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <select 
                    className="w-full p-2 border border-input rounded-md"
                    value={selectedEMonth}
                    onChange={(e) => setSelectedEMonth(e.target.value)}
                  >
                    <option value="january">January</option>
                    <option value="february">February</option>
                    <option value="march">March</option>
                    <option value="april">April</option>
                    <option value="may">May</option>
                    <option value="june">June</option>
                    <option value="july">July</option>
                    <option value="august">August</option>
                    <option value="september">September</option>
                    <option value="october">October</option>
                    <option value="november">November</option>
                    <option value="december">December</option>
                  </select>
                  
                  <CSVUpload
                    type="monthly-e"
                    month={selectedEMonth}
                    onUploadComplete={() => {}}
                    isUploaded={uploadStatus.monthly?.[selectedEMonth.toLowerCase()]?.e || false}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly O File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Business (O) Files</CardTitle>
                <CardDescription>Upload monthly Other Business CSV files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <select 
                    className="w-full p-2 border border-input rounded-md"
                    value={selectedOMonth}
                    onChange={(e) => setSelectedOMonth(e.target.value)}
                  >
                    <option value="january">January</option>
                    <option value="february">February</option>
                    <option value="march">March</option>
                    <option value="april">April</option>
                    <option value="may">May</option>
                    <option value="june">June</option>
                    <option value="july">July</option>
                    <option value="august">August</option>
                    <option value="september">September</option>
                    <option value="october">October</option>
                    <option value="november">November</option>
                    <option value="december">December</option>
                  </select>
                  
                  <CSVUpload
                    type="monthly-o"
                    month={selectedOMonth}
                    onUploadComplete={() => {}}
                    isUploaded={uploadStatus.monthly?.[selectedOMonth.toLowerCase()]?.o || false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Using Monthly CSV Files</h3>
              <ol className="list-decimal pl-5 text-blue-700 space-y-1">
                <li>For each month, upload both the Employee (E) and Business (O) files</li>
                <li>After upload, validate that the data looks correct using the View Data option</li>
                <li>Process the data to make it available in the dashboards and analysis</li>
                <li>Once processed, you can view the month's data in the Monthly Analysis page</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="annual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Annual CSV Upload</CardTitle>
              <CardDescription>Upload your annual consolidated CSV file</CardDescription>
            </CardHeader>
            <CardContent>
              <CSVUpload
                type="annual"
                onUploadComplete={() => {}}
                isUploaded={uploadStatus.annual || false}
              />
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Using Annual CSV Files</h3>
              <ol className="list-decimal pl-5 text-blue-700 space-y-1">
                <li>The annual CSV should contain columns for each month of the year</li>
                <li>Upload once for the entire year's dashboard</li>
                <li>Annual data powers the main dashboard with yearly trends</li>
                <li>For detailed monthly breakdowns, use the monthly uploads above</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}