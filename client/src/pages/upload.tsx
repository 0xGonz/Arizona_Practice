import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CSVUpload from "@/components/upload/csv-upload";
import { AlertCircle, Check, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStore } from "@/store/data-store";

export default function Upload() {
  const { uploadStatus, uploadHistory } = useStore();
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [selectedEMonth, setSelectedEMonth] = useState<string>("january");
  const [selectedOMonth, setSelectedOMonth] = useState<string>("january");
  
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
          <TabsTrigger value="help" className="flex-1">Help & Guidelines</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Annual Dashboard Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Annual Dashboard Upload</CardTitle>
                <CardDescription>Upload the Annual Consolidated CSV file</CardDescription>
              </CardHeader>
              <CardContent>
                <CSVUpload
                  type="annual"
                  onUploadComplete={() => {}}
                  isUploaded={uploadStatus.annual}
                />
              </CardContent>
            </Card>
            
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
                    // Format date
                    const formattedDate = new Intl.DateTimeFormat('en-US', {
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    }).format(upload.date);
                    
                    // Format file type for display
                    let displayType = '';
                    if (upload.type === 'annual') {
                      displayType = 'Annual Consolidated CSV';
                    } else if (upload.type === 'monthly-e') {
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
        
        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>CSV Format Guidelines</CardTitle>
              <CardDescription>Requirements for file formats and structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Annual Consolidated CSV</h3>
                  <p className="mb-2">The annual CSV file should have the following structure:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Column A: "Line Item" - Contains the financial category labels</li>
                    <li>Columns B-M: Monthly columns (e.g., "2024(Jan)", "2024(Feb)", ...)</li>
                    <li>Column N: Annual total column (e.g., "2024 Total")</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Monthly Employee (E) CSV</h3>
                  <p className="mb-2">The monthly E CSV files should have the following structure:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Column A: "Line Item" - Contains the financial category labels</li>
                    <li>Columns B-M: Individual employee columns (e.g., doctor names)</li>
                    <li>Column N: Summary column (e.g., "All Employees")</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Monthly Other Business (O) CSV</h3>
                  <p className="mb-2">The monthly O CSV files should have the following structure:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Column A: "Line Item" - Contains the financial category labels</li>
                    <li>Columns B-M: Individual entity/department columns</li>
                    <li>Column N: Summary column (e.g., "All Entities")</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Value Formatting</h3>
                  <p className="mb-2">The system can parse values in the following formats:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Dollar signs (e.g., "$1,500.00")</li>
                    <li>Commas as thousand separators (e.g., "1,500.00")</li>
                    <li>Parentheses for negative values (e.g., "($1,500.00)")</li>
                    <li>Plain numbers (e.g., "1500.00")</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Select({ 
  className, 
  placeholder, 
  options, 
  value, 
  onChange 
}: { 
  className?: string, 
  placeholder: string, 
  options: { label: string, value: string }[],
  value?: string,
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void 
}) {
  return (
    <div className={className}>
      <select 
        className="w-full p-2 border border-input rounded-md bg-white"
        value={value || ""}
        onChange={onChange}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
