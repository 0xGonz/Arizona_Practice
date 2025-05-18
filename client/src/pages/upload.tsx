import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CSVUpload from "@/components/upload/csv-upload";
import { AlertCircle, Check, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStore } from "@/store/data-store";

export default function Upload() {
  const { uploadStatus, uploadHistory, monthlyData } = useStore();
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [selectedEMonth, setSelectedEMonth] = useState<string>("january");
  const [selectedOMonth, setSelectedOMonth] = useState<string>("january");
  const [showProcessedData, setShowProcessedData] = useState(false);
  const [processedDataType, setProcessedDataType] = useState<string>("monthly-e");
  
  // Check if we're coming from a specific upload redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const month = params.get('month');
    
    if (type && month) {
      setActiveTab("upload");
      if (type === 'monthly-e') {
        setSelectedEMonth(month);
      } else if (type === 'monthly-o') {
        setSelectedOMonth(month);
      }
    }
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark mb-1">Data Management</h1>
        <p className="text-neutral-text">Upload and manage financial data files</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-muted mb-6">
          <TabsTrigger value="upload" className="flex-1">Upload Data</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Upload History</TabsTrigger>
          <TabsTrigger value="process" className="flex-1">Process & Validate</TabsTrigger>
          <TabsTrigger value="help" className="flex-1">Help & Guidelines</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    isUploaded={uploadStatus.monthly[selectedEMonth]?.e || false}
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
                    isUploaded={uploadStatus.monthly[selectedOMonth]?.o || false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>CSV Format Guidelines</AlertTitle>
            <AlertDescription>
              Monthly E and O files should have Line Item column followed by employee/entity columns.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>View history of uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadHistory.length > 0 ? (
                  uploadHistory.map((upload, index) => {
                    // Format date - ensure we have a valid date object
                    let formattedDate = "Unknown date";
                    try {
                      // If the date is stored as a string, convert it to a Date object
                      const dateObj = typeof upload.date === 'string' 
                        ? new Date(upload.date) 
                        : upload.date;
                        
                      formattedDate = new Intl.DateTimeFormat('en-US', {
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      }).format(dateObj);
                    } catch (err) {
                      console.error("Error formatting date:", err);
                    }
                    
                    // Format file type for display
                    let displayType = '';
                    if (upload.type === 'monthly-e') {
                      displayType = `${upload.month?.charAt(0).toUpperCase()}${upload.month?.slice(1)} Employee (E) CSV`;
                    } else if (upload.type === 'monthly-o') {
                      displayType = `${upload.month?.charAt(0).toUpperCase()}${upload.month?.slice(1)} Other Business (O) CSV`;
                    }
                    
                    return (
                      <div key={index} className="bg-muted rounded-md p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-positive mr-2" />
                          <div>
                            <p className="font-medium">{displayType}</p>
                            <p className="text-sm text-muted-foreground">Uploaded {formattedDate}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{upload.filename}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Upload History</h3>
                    <p className="text-muted-foreground">
                      You haven't uploaded any files yet. Start by uploading your CSV files.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="process">
          <Card>
            <CardHeader>
              <CardTitle>Process & Validate Uploaded Data</CardTitle>
              <CardDescription>Verify data is processed correctly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-base font-medium mb-3">Data Processing Options</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Data Type</label>
                        <select 
                          className="w-full p-2 border border-input rounded-md"
                          value={processedDataType}
                          onChange={(e) => setProcessedDataType(e.target.value)}
                        >
                          <option value="monthly-e">Monthly Employee (E) Data</option>
                          <option value="monthly-o">Monthly Other Business (O) Data</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Month</label>
                        <select
                            className="w-full p-2 border border-input rounded-md"
                            value={processedDataType === "monthly-e" ? selectedEMonth : selectedOMonth}
                            onChange={(e) => {
                              if (processedDataType === "monthly-e") {
                                setSelectedEMonth(e.target.value);
                              } else {
                                setSelectedOMonth(e.target.value);
                              }
                            }}
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
                        </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        className="w-full"
                        onClick={() => setShowProcessedData(true)}
                        disabled={
                          (processedDataType === "monthly-e" && !uploadStatus.monthly[selectedEMonth]?.e) ||
                          (processedDataType === "monthly-o" && !uploadStatus.monthly[selectedOMonth]?.o)
                        }
                      >
                        Process and View Data
                      </Button>
                      
                      <Button 
                        className="w-full"
                        variant="outline"
                        onClick={() => setShowProcessedData(false)}
                      >
                        Hide Data
                      </Button>
                    </div>
                  </div>
                </div>

                {showProcessedData && (
                  <div className="mt-6 border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-4">Processed Data Preview</h3>
                    
                    {processedDataType === "monthly-e" ? (
                      <div className="space-y-4">
                        <h4 className="font-medium">{selectedEMonth.charAt(0).toUpperCase() + selectedEMonth.slice(1)} Employee Data</h4>
                        <div className="overflow-auto max-h-[70vh]">
                          {monthlyData[selectedEMonth]?.e?.lineItems && monthlyData[selectedEMonth].e.lineItems.length > 0 ? (
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="border p-2 text-left">Line Item</th>
                                  {monthlyData[selectedEMonth].e.lineItems[0]?.entityValues && 
                                    Object.keys(monthlyData[selectedEMonth].e.lineItems[0].entityValues).map((entity, idx) => (
                                      <th key={idx} className="border p-2 text-right">{entity}</th>
                                    ))
                                  }
                                  <th className="border p-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthlyData[selectedEMonth].e.lineItems.map((item, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className={`border p-2 pl-${item.depth * 4}`} style={{paddingLeft: `${item.depth * 0.5}rem`}}>
                                      {item.name || 'N/A'}
                                    </td>
                                    {item.entityValues && Object.values(item.entityValues).map((value, idx) => (
                                      <td key={idx} className="border p-2 text-right">
                                        {typeof value === 'number' 
                                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value) 
                                          : value}
                                      </td>
                                    ))}
                                    <td className="border p-2 text-right font-medium">
                                      {typeof item.summaryValue === 'number' 
                                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.summaryValue) 
                                        : item.summaryValue}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No data available for {selectedEMonth} Employee CSV</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h4 className="font-medium">{selectedOMonth.charAt(0).toUpperCase() + selectedOMonth.slice(1)} Business Data</h4>
                        <div className="overflow-auto max-h-[70vh]">
                          {monthlyData[selectedOMonth]?.o?.lineItems && monthlyData[selectedOMonth].o.lineItems.length > 0 ? (
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="border p-2 text-left">Line Item</th>
                                  {monthlyData[selectedOMonth].o.lineItems[0]?.entityValues && 
                                    Object.keys(monthlyData[selectedOMonth].o.lineItems[0].entityValues).map((entity, idx) => (
                                      <th key={idx} className="border p-2 text-right">{entity}</th>
                                    ))
                                  }
                                  <th className="border p-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthlyData[selectedOMonth].o.lineItems.map((item, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className={`border p-2`} style={{paddingLeft: `${item.depth * 0.5}rem`}}>
                                      {item.name || 'N/A'}
                                    </td>
                                    {item.entityValues && Object.values(item.entityValues).map((value, idx) => (
                                      <td key={idx} className="border p-2 text-right">
                                        {typeof value === 'number' 
                                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value) 
                                          : value}
                                      </td>
                                    ))}
                                    <td className="border p-2 text-right font-medium">
                                      {typeof item.summaryValue === 'number' 
                                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.summaryValue) 
                                        : item.summaryValue}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No data available for {selectedOMonth} Business CSV</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>CSV Upload Guidelines</CardTitle>
              <CardDescription>Learn how to prepare and upload your financial data files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Employee (E) CSV Format</h3>
                <p className="mb-2 text-sm">Monthly Employee CSV files should contain the following:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Line Item column</strong>: Lists expense categories with proper indentation</li>
                  <li><strong>Employee columns</strong>: One column per employee showing their data</li>
                  <li><strong>Summary column</strong>: Contains totals for each line item</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Other Business (O) CSV Format</h3>
                <p className="mb-2 text-sm">Monthly Other Business CSV files should contain the following:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Line Item column</strong>: Lists expense categories with proper indentation</li>
                  <li><strong>Department columns</strong>: Columns for CBD, DME, Pharmacy, etc.</li>
                  <li><strong>Summary column</strong>: Contains totals for each line item</li>
                </ul>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <h3 className="text-md font-medium text-amber-800 mb-2">Important Notes</h3>
                <ul className="list-disc pl-5 text-sm space-y-1 text-amber-700">
                  <li>Ensure all cells with monetary values are formatted consistently</li>
                  <li>Maintain proper indentation in the Line Item column to preserve hierarchy</li>
                  <li>Make sure totals are calculated correctly before uploading</li>
                  <li>Upload files for each month separately using the dropdown selector</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}