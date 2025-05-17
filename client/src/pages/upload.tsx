import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CSVUpload from "@/components/upload/csv-upload";
import { AlertCircle, Check, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStore } from "@/store/data-store";

export default function Upload() {
  const { uploadStatus, uploadHistory, annualData, monthlyData } = useStore();
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [selectedEMonth, setSelectedEMonth] = useState<string>("january");
  const [selectedOMonth, setSelectedOMonth] = useState<string>("january");
  const [showProcessedData, setShowProcessedData] = useState(false);
  const [processedDataType, setProcessedDataType] = useState<string>("annual");
  
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
                  <Select
                    className="w-full"
                    placeholder="Select Month..."
                    value={selectedEMonth}
                    onChange={(e) => setSelectedEMonth(e.target.value)}
                    options={[
                      { label: "January", value: "january" },
                      { label: "February", value: "february" },
                      { label: "March", value: "march" },
                      { label: "April", value: "april" },
                      { label: "May", value: "may" },
                      { label: "June", value: "june" },
                      { label: "July", value: "july" },
                      { label: "August", value: "august" },
                      { label: "September", value: "september" },
                      { label: "October", value: "october" },
                      { label: "November", value: "november" },
                      { label: "December", value: "december" }
                    ]}
                  />
                  
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
                <CardTitle>Monthly Other Business (O) Files</CardTitle>
                <CardDescription>Upload monthly Other Business CSV files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select
                    className="w-full"
                    placeholder="Select Month..."
                    value={selectedOMonth}
                    onChange={(e) => setSelectedOMonth(e.target.value)}
                    options={[
                      { label: "January", value: "january" },
                      { label: "February", value: "february" },
                      { label: "March", value: "march" },
                      { label: "April", value: "april" },
                      { label: "May", value: "may" },
                      { label: "June", value: "june" },
                      { label: "July", value: "july" },
                      { label: "August", value: "august" },
                      { label: "September", value: "september" },
                      { label: "October", value: "october" },
                      { label: "November", value: "november" },
                      { label: "December", value: "december" }
                    ]}
                  />
                  
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
              Please ensure your CSV files follow the expected format. Annual files should have columns for Line Item, monthly data, and annual total. 
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
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No uploads yet. Start by uploading your financial data files.</p>
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
              <CardDescription>Verify data is processed correctly before viewing on dashboard</CardDescription>
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
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        className="w-full"
                        onClick={() => setShowProcessedData(true)}
                        disabled={
                          (processedDataType === "annual" && !uploadStatus.annual) ||
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
                    
                    {processedDataType === "annual" && uploadStatus.annual ? (
                      <div className="space-y-4">
                        <h4 className="font-medium">Annual Data</h4>
                        <div className="overflow-auto max-h-[70vh]">
                          {annualData && Array.isArray(annualData) && annualData.length > 0 ? (
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="border p-2 text-left">Line Item</th>
                                  {Object.keys(annualData[0])
                                    .filter(key => key !== 'Line Item')
                                    .map((column, idx) => (
                                      <th key={idx} className="border p-2 text-right">{column}</th>
                                    ))
                                  }
                                </tr>
                              </thead>
                              <tbody>
                                {annualData.map((row, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border p-2">{row['Line Item'] || 'N/A'}</td>
                                    {Object.keys(row)
                                      .filter(key => key !== 'Line Item')
                                      .map((column, idx) => (
                                        <td key={idx} className="border p-2 text-right">{row[column] || ''}</td>
                                      ))
                                    }
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No data available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : processedDataType === "monthly-e" && uploadStatus.monthly[selectedEMonth]?.e ? (
                      <div className="space-y-4">
                        <h4 className="font-medium">Monthly Employee Data ({selectedEMonth.charAt(0).toUpperCase() + selectedEMonth.slice(1)})</h4>
                        <div className="overflow-auto max-h-[70vh]">
                          {monthlyData[selectedEMonth]?.e && Array.isArray(monthlyData[selectedEMonth]?.e) && monthlyData[selectedEMonth]?.e.length > 0 ? (
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="border p-2 text-left">Line Item</th>
                                  {Object.keys(monthlyData[selectedEMonth].e[0])
                                    .filter(key => key !== 'Line Item')
                                    .map((column, idx) => (
                                      <th key={idx} className="border p-2 text-right">{column}</th>
                                    ))
                                  }
                                </tr>
                              </thead>
                              <tbody>
                                {monthlyData[selectedEMonth].e.map((row, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border p-2">{row['Line Item'] || 'N/A'}</td>
                                    {Object.keys(row)
                                      .filter(key => key !== 'Line Item')
                                      .map((column, idx) => (
                                        <td key={idx} className="border p-2 text-right">{row[column] || ''}</td>
                                      ))
                                    }
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No data available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : processedDataType === "monthly-o" && uploadStatus.monthly[selectedOMonth]?.o ? (
                      <div className="space-y-4">
                        <h4 className="font-medium">Monthly Other Business Data ({selectedOMonth.charAt(0).toUpperCase() + selectedOMonth.slice(1)})</h4>
                        <div className="overflow-auto max-h-[70vh]">
                          {monthlyData[selectedOMonth]?.o && Array.isArray(monthlyData[selectedOMonth]?.o) && monthlyData[selectedOMonth]?.o.length > 0 ? (
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="border p-2 text-left">Line Item</th>
                                  {Object.keys(monthlyData[selectedOMonth].o[0])
                                    .filter(key => key !== 'Line Item')
                                    .map((column, idx) => (
                                      <th key={idx} className="border p-2 text-right">{column}</th>
                                    ))
                                  }
                                </tr>
                              </thead>
                              <tbody>
                                {monthlyData[selectedOMonth].o.map((row, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border p-2">{row['Line Item'] || 'N/A'}</td>
                                    {Object.keys(row)
                                      .filter(key => key !== 'Line Item')
                                      .map((column, idx) => (
                                        <td key={idx} className="border p-2 text-right">{row[column] || ''}</td>
                                      ))
                                    }
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No data available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No data available for selected type. Please upload data first.</p>
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
              <CardTitle>Help & Guidelines</CardTitle>
              <CardDescription>Learn how to prepare and upload your financial data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">CSV File Requirements</h3>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Annual CSV Format</h4>
                    <p className="mb-2">Your annual CSV file should include:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>First column labeled "Line Item" containing expense/revenue categories</li>
                      <li>Columns for each month (e.g., "2024(Jan)", "2024(Feb)", etc.)</li>
                      <li>A "Total" column with yearly totals</li>
                      <li>Numbers formatted as currency with commas and decimal places</li>
                      <li>Negative values in parentheses, e.g., "(1,234.56)"</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Monthly Employee (E) CSV Format</h4>
                    <p className="mb-2">Your monthly E CSV files should include:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>First column labeled "Line Item" with expense/revenue categories</li>
                      <li>Columns for each employee or department</li>
                      <li>An "All Employees" column with totals</li>
                      <li>Numbers formatted as currency with commas and decimal places</li>
                      <li>Negative values in parentheses, e.g., "(1,234.56)"</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Monthly Other Business (O) CSV Format</h4>
                    <p className="mb-2">Your monthly O CSV files should include:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>First column labeled "Line Item" with expense/revenue categories</li>
                      <li>Columns for each business entity</li>
                      <li>An "All Entities" column with totals</li>
                      <li>Numbers formatted as currency with commas and decimal places</li>
                      <li>Negative values in parentheses, e.g., "(1,234.56)"</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Upload Process</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Prepare your CSV files according to the formats above</li>
                  <li>Navigate to the "Upload Data" tab</li>
                  <li>Select the appropriate file type (Annual, Monthly E, or Monthly O)</li>
                  <li>For monthly files, select the month from the dropdown</li>
                  <li>Click "Choose File" and select your CSV file</li>
                  <li>Click "Upload" to process the file</li>
                  <li>Verify your data in the "Process & Validate" tab</li>
                  <li>View results in the Dashboard</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Troubleshooting</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><span className="font-medium">Upload fails:</span> Ensure your CSV follows the required format</li>
                  <li><span className="font-medium">Missing data:</span> Check that all required columns are present</li>
                  <li><span className="font-medium">Incorrect values:</span> Verify number formatting in your CSV</li>
                  <li><span className="font-medium">Dashboard not updating:</span> Confirm your data is properly processed in the "Process & Validate" tab</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple Select component for the dropdowns
function Select({ 
  className, 
  placeholder, 
  value, 
  onChange, 
  options 
}: { 
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string; }[];
}) {
  return (
    <select 
      className={`p-2 border border-input rounded-md ${className}`}
      value={value}
      onChange={onChange}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}