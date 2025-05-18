import { useState, useRef, useEffect } from "react";
import { CSVType } from "@/types";
import { Button } from "@/components/ui/button";
import { Upload, Check, AlertCircle, Eye, FileCheck, X } from "lucide-react";
import { useStore } from "@/store/data-store";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CSVUploadProps {
  type: CSVType;
  month?: string;
  onUploadComplete: () => void;
  isUploaded?: boolean;
}

export default function CSVUpload({
  type,
  month,
  onUploadComplete,
  isUploaded = false
}: CSVUploadProps) {
  const { toast } = useToast();
  const { processCSVData, setUploadStatus, uploadStatus, clearUploadedData } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [previewTab, setPreviewTab] = useState<'csv' | 'validate'>('csv');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  
  // Data validation state
  const [csvValidation, setCsvValidation] = useState({
    isValid: false,
    errors: [] as string[],
    warnings: [] as string[],
    stats: {
      rowCount: 0,
      columnCount: 0,
      hasLineItem: false,
      lineItemValues: [] as string[],
      hasEntityColumns: false,
      entityColumns: [] as string[],
      hasSummaryColumn: false,
      summaryColumn: ""
    }
  });

  // Check if this data is already uploaded
  useEffect(() => {
    if (month && (type === 'monthly-e' || type === 'monthly-o')) {
      const monthKey = month.toLowerCase().trim();
      const isAlreadyUploaded = uploadStatus.monthly?.[monthKey]?.[type === 'monthly-e' ? 'e' : 'o'] || false;
      
      if (isAlreadyUploaded) {
        // Get the upload ID if available from localStorage
        try {
          const uploads = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
          const matchingUpload = uploads.find((upload: any) => 
            upload.type === type && 
            upload.month?.toLowerCase() === monthKey.toLowerCase()
          );
          
          if (matchingUpload && matchingUpload.id) {
            setUploadId(matchingUpload.id);
          }
        } catch (e) {
          console.error("Error checking upload history:", e);
        }
      }
    }
  }, [month, type, uploadStatus]);

  // Validate the CSV data
  const validateCSVData = (data: Record<string, string>[]) => {
    if (!data || data.length === 0) {
      return {
        isValid: false,
        errors: ["CSV file contains no data"],
        warnings: [],
        stats: { 
          rowCount: 0,
          columnCount: 0,
          hasLineItem: false,
          lineItemValues: [],
          hasEntityColumns: false,
          entityColumns: [],
          hasSummaryColumn: false,
          summaryColumn: ""
        }
      };
    }

    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      stats: {
        rowCount: data.length,
        columnCount: 0,
        hasLineItem: false,
        lineItemValues: [] as string[],
        hasEntityColumns: false,
        entityColumns: [] as string[],
        hasSummaryColumn: false,
        summaryColumn: "" as string
      }
    };

    // Check first row for structure
    const firstRow = data[0];
    const headers = Object.keys(firstRow || {});
    result.stats.columnCount = headers.length;
    
    // Check for Line Item column
    if (!('Line Item' in firstRow)) {
      result.isValid = false;
      result.errors.push("Missing 'Line Item' column - CSV must have a Line Item column");
    } else {
      result.stats.hasLineItem = true;
      
      // Sample some line item values for display
      const lineItemSamples = data
        .slice(0, 10)
        .map(row => row['Line Item'])
        .filter(Boolean);
      
      result.stats.lineItemValues = lineItemSamples;
    }
    
    // Check for entity columns
    if (type === 'monthly-e' || type === 'monthly-o') {
      // For monthly files we need entity columns (employee or business names)
      // Entity columns are all columns except Line Item and summary columns
      const potentialEntityColumns = headers.filter(header => 
        header !== 'Line Item' && 
        !header.toLowerCase().includes('all') &&
        !header.toLowerCase().includes('total')
      );
      
      if (potentialEntityColumns.length === 0) {
        result.warnings.push("No entity columns found - missing employee/business columns");
      } else {
        result.stats.hasEntityColumns = true;
        result.stats.entityColumns = potentialEntityColumns;
      }
      
      // Check for summary column
      const potentialSummaryColumns = headers.filter(header => 
        header.toLowerCase().includes('all') || 
        header.toLowerCase().includes('total')
      );
      
      if (potentialSummaryColumns.length === 0) {
        result.warnings.push("No summary column found - missing 'All Employees' or 'Total' column");
      } else {
        result.stats.hasSummaryColumn = true;
        result.stats.summaryColumn = potentialSummaryColumns[0];
      }
    } else if (type === 'annual') {
      // For annual files we expect monthly columns
      const monthNames = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
      ];
      
      const monthColumns = headers.filter(header => 
        monthNames.some(month => header.toLowerCase().includes(month)) ||
        header.match(/\b(20\d{2})[-\s]?[(]?([a-z]{3})[)]?\b/i) // Match patterns like "2023(Jan)"
      );
      
      if (monthColumns.length === 0) {
        result.warnings.push("No month columns found in annual CSV");
      }
      
      const totalColumn = headers.find(header => 
        header.toLowerCase().includes('total')
      );
      
      if (!totalColumn) {
        result.warnings.push("No total column found in annual CSV");
      }
    }
    
    // Check for critical financial line items
    const hasRevenue = data.some(row => 
      row['Line Item']?.toLowerCase()?.includes('total revenue')
    );
    
    const hasExpenses = data.some(row => 
      row['Line Item']?.toLowerCase()?.includes('total operating expenses') ||
      row['Line Item']?.toLowerCase()?.includes('total expense')
    );
    
    const hasNetIncome = data.some(row => 
      row['Line Item']?.toLowerCase()?.includes('net income')
    );
    
    if (!hasRevenue) {
      result.warnings.push("No 'Total Revenue' line item found");
    }
    
    if (!hasExpenses) {
      result.warnings.push("No 'Total Operating Expenses' line item found");
    }
    
    if (!hasNetIncome) {
      result.warnings.push("No 'Net Income' line item found");
    }
    
    // Detect potential missing or problematic data
    const emptyLineItems = data.filter(row => !row['Line Item'] || row['Line Item'].trim() === '').length;
    if (emptyLineItems > 0) {
      result.warnings.push(`${emptyLineItems} rows have empty Line Item values`);
    }
    
    // Check if numeric fields are actually numbers
    let nonNumericValues = 0;
    
    data.forEach(row => {
      Object.entries(row).forEach(([column, value]) => {
        if (column !== 'Line Item') {
          const cleanValue = value?.toString().replace(/[$,()]/g, '').trim();
          if (cleanValue && isNaN(Number(cleanValue))) {
            nonNumericValues++;
          }
        }
      });
    });
    
    if (nonNumericValues > 0) {
      result.warnings.push(`${nonNumericValues} non-numeric values found in data columns`);
    }
    
    return result;
  };

  // Parse the file locally first for validation
  const parseFileLocally = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Remove BOM characters or any special characters
        return header.replace(/^\uFEFF/, '').trim();
      },
      complete: (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            setError(`CSV parsing error: ${results.errors[0].message}`);
            setIsUploading(false);
            return;
          }
          
          console.log("CSV parse complete, parsed", results.data.length, "rows");
          
          // Cast the data to the correct type
          const typedData = results.data as Record<string, string>[];
          
          // Validate the CSV data
          const validation = validateCSVData(typedData);
          setCsvValidation(validation);
          
          if (!validation.isValid && validation.errors.length > 0) {
            setError(`CSV validation error: ${validation.errors[0]}`);
            setIsUploading(false);
            return;
          }
          
          // Store the parsed data for preview
          setCsvData(typedData);
          setIsUploading(false);
          
          // Show preview dialog immediately
          setShowPreview(true);
          
          // Store the file for later upload when user confirms
          setFileToUpload(file);
        } catch (error) {
          console.error("Error processing CSV data:", error);
          setError(`Error processing CSV data: ${error instanceof Error ? error.message : String(error)}`);
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setError(`CSV parsing error: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  // Function to handle file upload
  const uploadAndParseFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setCsvData(null);
    
    // Check file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setIsUploading(false);
      return;
    }

    try {
      // First parse the file locally for validation
      parseFileLocally(file);
    } catch (parseError) {
      console.error("Error parsing file:", parseError);
      setError(`Error parsing file: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    await uploadAndParseFile(file);
  };

  // Drag and drop handlers
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadAndParseFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Upload to server after validation
  const uploadToServer = async () => {
    if (!fileToUpload || !csvData) {
      toast({
        title: "No File Selected",
        description: "Please upload a CSV file first",
        variant: "destructive"
      });
      return;
    }

    // Now that the user has validated the data, upload to server
    try {
      setIsUploading(true);
      
      // Upload file to server
      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Determine the API endpoint based on the CSV type
      let apiEndpoint = '';
      if (type === 'annual') {
        apiEndpoint = '/api/upload/annual';
      } else if (type === 'monthly-e' && month) {
        apiEndpoint = `/api/upload/monthly/e?month=${encodeURIComponent(month)}`;
      } else if (type === 'monthly-o' && month) {
        apiEndpoint = `/api/upload/monthly/o?month=${encodeURIComponent(month)}`;
      } else {
        throw new Error('Invalid upload type or missing month parameter');
      }

      console.log(`Uploading file to server at ${apiEndpoint}`);
      
      // Send the file to the server
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error during upload');
      }

      // Continue with server upload result
      const uploadResult = await response.json();
      console.log('Server upload successful:', uploadResult);
      
      // Save upload ID for processing later
      if (uploadResult.id) {
        setUploadId(uploadResult.id);
      }

      setIsUploading(false);
      
      // Show process dialog to let user confirm processing
      setShowProcessDialog(true);
      
    } catch (uploadError) {
      console.error("File upload error:", uploadError);
      setError(`Error uploading file to server: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
      setIsUploading(false);
    }
  };

  // Process the CSV data
  const handleProcessCSV = async () => {
    if (!csvData) {
      toast({
        title: "No Data to Process",
        description: "Please upload a CSV file first",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessStatus('processing');
      setIsProcessing(true);
      
      // Ensure month is standardized to lowercase
      const monthKey = month ? month.toLowerCase().trim() : '';
      
      // Process the CSV data into the application state
      await processCSVData(type, csvData, monthKey);
      
      // If we have an upload ID, mark it as processed on the server
      if (uploadId) {
        try {
          const response = await fetch(`/api/uploads/${uploadId}/mark-processed`, {
            method: 'POST'
          });
          
          if (!response.ok) {
            console.warn(`Warning: Failed to mark upload ${uploadId} as processed`, await response.text());
          }
        } catch (markError) {
          console.warn("Error marking upload as processed:", markError);
        }
      }
      
      // Update upload status in the store
      if (type === 'monthly-e' || type === 'monthly-o') {
        const typeKey = type === 'monthly-e' ? 'e' : 'o';
        const monthKey = month ? month.toLowerCase().trim() : '';
        
        // Make sure we have the latest status
        const currentMonthlyStatus = { ...uploadStatus.monthly };
        if (!currentMonthlyStatus[monthKey]) {
          currentMonthlyStatus[monthKey] = {
            e: false,
            o: false
          };
        }
        
        currentMonthlyStatus[monthKey][typeKey] = true;
        
        setUploadStatus({
          monthly: currentMonthlyStatus
        });
      } else if (type === 'annual') {
        setUploadStatus({
          annual: true
        });
      }
      
      setProcessStatus('success');
      
      toast({
        title: "CSV Processed Successfully",
        description: "The data has been loaded into the application.",
      });
      
      // Close dialogs
      setShowProcessDialog(false);
      setShowPreview(false);
      setIsProcessing(false);
      
      onUploadComplete();
    } catch (error) {
      setProcessStatus('error');
      
      toast({
        title: "Error Processing Data",
        description: `${error instanceof Error ? error.message : "Unexpected error processing the data"}`,
        variant: "destructive"
      });
      
      setIsProcessing(false);
    }
  };

  // Handle direct delete request from upload button if data already exists
  const handleDeleteExisting = async () => {
    if (!month || !(type === 'monthly-e' || type === 'monthly-o')) {
      return;
    }

    try {
      const typeKey = type === 'monthly-e' ? 'e' : 'o';
      const monthKey = month.toLowerCase().trim();
      
      // Clear data from the server
      await clearUploadedData(type, monthKey);
      
      toast({
        title: "Data Cleared",
        description: `${type} data for ${month} has been removed`,
      });
      
      // Update the local upload status
      const currentMonthlyStatus = { ...uploadStatus.monthly };
      if (currentMonthlyStatus[monthKey]) {
        currentMonthlyStatus[monthKey][typeKey] = false;
      }
      
      setUploadStatus({
        monthly: currentMonthlyStatus
      });
      
      // Clear local state
      setCsvData(null);
      setUploadId(null);
      setShowPreview(false);
      setFileToUpload(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Error Clearing Data",
        description: `${error instanceof Error ? error.message : "Unexpected error deleting the data"}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        ref={fileInputRef}
        accept=".csv" 
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Upload Button UI */}
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-lg p-6 
          ${isUploaded ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-gray-700'} 
          hover:border-primary
          transition-colors duration-200
          flex flex-col items-center justify-center
          cursor-pointer
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploaded ? (
          <div className="text-center">
            <Check className="h-10 w-10 text-green-500 mb-2 mx-auto" />
            <p className="text-sm font-medium mb-1">
              {type === 'annual' ? 'Annual' : type === 'monthly-e' ? 'Employee' : 'Operating'} 
              {month ? ` ${month}` : ''} data uploaded
            </p>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteExisting();
              }}
              variant="destructive" 
              size="sm"
            >
              <X className="h-4 w-4 mr-1" /> Delete and Replace
            </Button>
          </div>
        ) : isUploading ? (
          <div className="text-center">
            <div className="animate-pulse">
              <Upload className="h-10 w-10 text-primary/70 mb-2 mx-auto" />
            </div>
            <p className="text-sm font-medium">Uploading...</p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="h-10 w-10 text-gray-400 mb-2 mx-auto" />
            <p className="text-sm font-medium mb-1">
              Upload {type === 'annual' ? 'Annual' : type === 'monthly-e' ? 'Employee' : 'Operating'}
              {month ? ` ${month}` : ''} CSV
            </p>
            <p className="text-xs text-gray-500">
              Drag &amp; drop or click to browse
            </p>
            {error && (
              <div className="mt-2 text-red-500 text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {error}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* CSV Preview Dialog - Step 1: Validation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[90vw] w-[800px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileCheck className="h-5 w-5 mr-2" />
              CSV Data Preview
            </DialogTitle>
            <DialogDescription>
              Review your data before processing it into the application
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="csv" value={previewTab} onValueChange={(value) => setPreviewTab(value as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="csv">Data Preview</TabsTrigger>
              <TabsTrigger value="validate">Validation Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="csv" className="flex-1 mt-0">
              {csvData ? (
                <div className="flex flex-col h-full">
                  <div className="text-sm mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {csvData.length} rows
                    </Badge>
                    {csvValidation.isValid ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Valid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" /> Invalid
                      </Badge>
                    )}
                  </div>
                  
                  <ScrollArea className="flex-1 border rounded-md">
                    <div className="overflow-x-auto p-2">
                      <table className="min-w-full">
                        <thead className="sticky top-0 bg-white dark:bg-gray-950 shadow-sm">
                          <tr>
                            {csvData.length > 0 && Object.keys(csvData[0]).map((header, i) => (
                              <th key={i} className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 15).map((row, rowIdx) => (
                            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
                              {Object.entries(row).map(([key, value], cellIdx) => (
                                <td key={cellIdx} className="p-2 text-xs whitespace-nowrap border-b border-gray-200 dark:border-gray-800">
                                  {value || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {csvData.length > 15 && (
                            <tr>
                              <td colSpan={Object.keys(csvData[0]).length} className="p-2 text-xs text-center italic text-gray-500">
                                ... {csvData.length - 15} more rows
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data to preview
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="validate" className="space-y-4 h-full overflow-y-auto mt-0">
              <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-medium mb-2">CSV Stats</h3>
                <ul className="space-y-1 text-sm">
                  <li>Rows: <span className="font-mono">{csvValidation.stats.rowCount}</span></li>
                  <li>Columns: <span className="font-mono">{csvValidation.stats.columnCount}</span></li>
                  <li>Line Item Column: 
                    {csvValidation.stats.hasLineItem ? (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Present
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                        <X className="h-3 w-3 mr-1" /> Missing
                      </Badge>
                    )}
                  </li>
                  {(type === 'monthly-e' || type === 'monthly-o') ? (
                    <>
                      <li>Entity Columns: 
                        {csvValidation.stats.hasEntityColumns ? (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Present
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                            <X className="h-3 w-3 mr-1" /> Missing
                          </Badge>
                        )}
                      </li>
                      <li>Summary Column: 
                        {csvValidation.stats.hasSummaryColumn ? (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Present ({csvValidation.stats.summaryColumn})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                            <X className="h-3 w-3 mr-1" /> Missing
                          </Badge>
                        )}
                      </li>
                    </>
                  ) : null}
                </ul>
              </div>
              
              {csvValidation.errors.length > 0 && (
                <div className="border rounded-md p-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                  <h3 className="font-medium text-red-700 dark:text-red-400 mb-2">Errors</h3>
                  <ul className="space-y-1 text-sm list-disc pl-5 text-red-700 dark:text-red-400">
                    {csvValidation.errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {csvValidation.warnings.length > 0 && (
                <div className="border rounded-md p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
                  <h3 className="font-medium text-yellow-700 dark:text-yellow-400 mb-2">Warnings</h3>
                  <ul className="space-y-1 text-sm list-disc pl-5 text-yellow-700 dark:text-yellow-400">
                    {csvValidation.warnings.map((warning: string, i: number) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {csvValidation.stats.lineItemValues.length > 0 && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Line Item Samples</h3>
                  <ul className="space-y-1 text-sm list-disc pl-5 text-gray-600 dark:text-gray-400">
                    {csvValidation.stats.lineItemValues.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex items-center justify-between">
            <div>
              {csvValidation.warnings.length > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <AlertCircle className="h-3 w-3 mr-1" /> {csvValidation.warnings.length} warnings
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  // Reset the uploaded file
                  setFileToUpload(null);
                  setCsvData(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={uploadToServer}
                disabled={!csvValidation.isValid || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Confirm & Upload to Server'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Process Confirmation Dialog - Step 2: Processing */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process CSV Data</DialogTitle>
            <DialogDescription>
              The file has been uploaded to the server.
              Do you want to process the data now?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm">
              Click "Process Now" to analyze the CSV and add the data to the application.
            </p>
            
            <div className="mt-4">
              {csvValidation.warnings.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
                  <p className="font-medium flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {csvValidation.warnings.length} warnings detected
                  </p>
                  <p className="mt-1 text-xs">
                    You can still process the data, but be aware of these issues.
                  </p>
                </div>
              )}
              
              {processStatus === 'processing' && (
                <div className="animate-pulse p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
                  <p className="font-medium">Processing data...</p>
                  <p className="mt-1 text-xs">
                    This may take a moment depending on the size of the file.
                  </p>
                </div>
              )}
              
              {processStatus === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <p className="font-medium flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Error processing data
                  </p>
                  <p className="mt-1 text-xs">
                    Please try again or check the file format.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcessDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessCSV}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}