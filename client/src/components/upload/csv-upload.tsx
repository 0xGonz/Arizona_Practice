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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { uploadRawCSVData, processCSVData, setUploadStatus, uploadStatus, clearUploadedData } = useStore();
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
  const [csvValidation, setCsvValidation] = useState<any>({
    isValid: false,
    errors: [],
    warnings: [],
    stats: {
      rowCount: 0,
      columnCount: 0
    }
  });
  // Step in the upload process: 'upload', 'validation', 'processing', 'complete'
  const [uploadStep, setUploadStep] = useState<'upload' | 'validation' | 'processing' | 'complete'>('upload');

  // This effect checks if the data for this month/type is already uploaded and ready
  useEffect(() => {
    if (month && (type === 'monthly-e' || type === 'monthly-o')) {
      const monthKey = month.toLowerCase().trim();
      const isAlreadyUploaded = uploadStatus.monthly?.[monthKey]?.[type === 'monthly-e' ? 'e' : 'o'] || false;
      
      if (isAlreadyUploaded) {
        // Get the upload ID if available from localStorage or store
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

  const validateCSVData = (data: Record<string, string>[]): any => {
    if (!data || data.length === 0) {
      return {
        isValid: false,
        errors: ["CSV file contains no data"],
        warnings: [],
        stats: { rowCount: 0 }
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

  const parseFileLocally = (file: File) => {
    // Parse the file in the browser for validation
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Remove BOM characters or any special characters that might be in the header
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
          
          // Validate the CSV data
          const validation = validateCSVData(results.data);
          setCsvValidation(validation);
          
          if (!validation.isValid && validation.errors.length > 0) {
            setError(`CSV validation error: ${validation.errors[0]}`);
            setIsUploading(false);
            return;
          }
          
          // Store the parsed data
          setCsvData(results.data);
          setIsUploading(false);
          setUploadStep('validation'); // Move to the validation step
          setFileToUpload(file); // Store the file for later upload when user confirms
        } catch (error) {
          console.error("Error processing CSV data:", error);
          setError("Error processing CSV data");
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
      // First parse the file in the browser for validation
      // We won't upload to the server until the user confirms the data is correct
      parseFileLocally(file);
    } catch (parseError) {
      console.error("Error parsing file:", parseError);
      setError(`Error parsing file: ${String(parseError)}`);
      setIsUploading(false);
      return;
    }
  };
        try {
          if (results.errors && results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            setError(`CSV parsing error: ${results.errors[0].message}`);
            setIsUploading(false);
            return;
          }

          // Log parsed data for debugging
          console.log("CSV parse complete, parsed", results.data ? results.data.length : 0, "rows");
          
          // Ensure we have an array of objects with at least a Line Item column
          const data = results.data as Record<string, string>[];
          
          // Special case for financial data: we need to identify the 'Line Item' column
          // It might be named differently or have BOM characters
          if (Array.isArray(data) && data.length > 0) {
            const firstRow = data[0];
            const headers = Object.keys(firstRow || {});
            
            // Check if we need to rename any column to 'Line Item'
            const hasLineItem = 'Line Item' in firstRow;
            if (!hasLineItem) {
              // Look for a column that might be the line item column
              const possibleLineItemColumns = headers.filter(h => 
                h.toLowerCase().includes('line') || 
                h.toLowerCase().includes('item') ||
                h.toLowerCase().includes('description')
              );
              
              if (possibleLineItemColumns.length > 0) {
                // Use the first matching column as Line Item
                const lineItemColumn = possibleLineItemColumns[0];
                console.log(`Renaming column '${lineItemColumn}' to 'Line Item'`);
                
                // Rename the column in all rows
                data.forEach(row => {
                  row['Line Item'] = row[lineItemColumn];
                  // Don't delete the original column to avoid breaking any code that might use it
                });
              }
            }
          }
          
          // Ensure we have all the data safely structured
          const safeData = data.map(row => {
            // Ensure 'Line Item' exists in each row
            if (!('Line Item' in row)) {
              // Create a new row with default Line Item
              return { 
                'Line Item': 'Unknown Item',
                ...row 
              };
            }
            return row;
          });
          
          // Validate the data and store validation results
          const validationResult = validateCSVData(safeData);
          setValidationResults(validationResult);
          
          // Store the data locally (don't process into state yet, wait for user confirmation)
          setCsvData(safeData);
          
          // Ensure month is standardized to lowercase
          const monthKey = month ? month.toLowerCase().trim() : '';
          
          // Just store the raw CSV data without processing it yet
          uploadRawCSVData(type, safeData, monthKey);
          
          // Success notification
          toast({
            title: "CSV Uploaded Successfully",
            description: "Your file is ready to be validated and processed.",
          });
          
          // Show preview dialog
          setShowPreview(true);
          setIsUploading(false);
          onUploadComplete();
        } catch (error) {
          console.error("CSV processing error:", error);
          setError('Error processing the CSV file');
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setError(`Error parsing the CSV file: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    await uploadAndParseFile(file);
  };

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
      if (type === 'annual') {
        setUploadStatus({ annual: true });
      } else if (type === 'monthly-e' && monthKey) {
        // Update monthly status for e-type CSV
        let currentMonthly = {...(uploadStatus.monthly || {})};
        currentMonthly[monthKey] = {
          ...(currentMonthly[monthKey] || {}),
          e: true,
          o: (currentMonthly[monthKey]?.o) || false
        };
        
        setUploadStatus({ monthly: currentMonthly });
      } else if (type === 'monthly-o' && monthKey) {
        // Update monthly status for o-type CSV
        let currentMonthly = {...(uploadStatus.monthly || {})};
        currentMonthly[monthKey] = {
          ...(currentMonthly[monthKey] || {}),
          e: (currentMonthly[monthKey]?.e) || false,
          o: true
        };
        
        setUploadStatus({ monthly: currentMonthly });
      }
      
      setProcessStatus('success');
      
      // Success notification
      toast({
        title: "CSV Processed Successfully",
        description: "Your data has been processed and is now available for analysis",
      });
      
      // Close dialogs
      setTimeout(() => {
        setShowProcessDialog(false);
        setShowPreview(false);
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      console.error("Error processing CSV data:", error);
      setProcessStatus('error');
      
      toast({
        title: "Processing Error",
        description: `Failed to process CSV data: ${error.message || "Unknown error"}`,
        variant: "destructive"
      });
      
      setIsProcessing(false);
    }
  };

  const handleViewData = () => {
    if (uploadId) {
      // If we have an upload ID, we can view the data directly from the server
      fetchUploadData(uploadId);
    } else if (csvData) {
      // Otherwise use the cached data
      setShowPreview(true);
    } else {
      toast({
        title: "No Data Available",
        description: "No data found for this upload",
        variant: "destructive"
      });
    }
  };

  const fetchUploadData = async (id: number) => {
    try {
      const response = await fetch(`/api/uploads/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch upload data: ${response.statusText}`);
      }
      
      const uploadData = await response.json();
      
      if (uploadData) {
        // Parse the content if needed
        let parsedData;
        try {
          // If content is a JSON string, parse it
          if (typeof uploadData.content === 'string') {
            parsedData = JSON.parse(uploadData.content);
          } else {
            parsedData = uploadData.content;
          }
          
          setCsvData(parsedData);
          setValidationResults(validateCSVData(parsedData));
          setShowPreview(true);
        } catch (parseError) {
          console.error("Error parsing upload data:", parseError);
          toast({
            title: "Error Viewing Data",
            description: "Failed to parse upload data",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "No Data Found",
          description: "No data found for this upload",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching upload data:", error);
      toast({
        title: "Error Fetching Data",
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleClearData = () => {
    const confirmClear = window.confirm(`Are you sure you want to clear all ${type === 'annual' ? 'annual' : month} ${type === 'monthly-e' ? 'employee' : type === 'monthly-o' ? 'business' : ''} data? This cannot be undone.`);
    
    if (confirmClear) {
      const monthKey = month ? month.toLowerCase().trim() : '';
      clearUploadedData(type, monthKey);
      
      toast({
        title: "Data Cleared Successfully",
        description: `Your ${type} data has been removed.`,
      });
      
      // Reset UI state
      setCsvData(null);
      setUploadId(null);
      setShowPreview(false);
      setValidationResults({
        isValid: false,
        errors: [],
        warnings: [],
        stats: {}
      });
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
      
      {isUploaded ? (
        <div className="p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50 text-center">
          <div className="flex items-center justify-center mb-2">
            <Check className="h-6 w-6 text-blue-500 mr-2" />
            <span className="font-medium text-blue-800">File Uploaded</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewData}
              className="flex items-center gap-1"
            >
              <Eye size={14} />
              View Data
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setShowProcessDialog(true)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
              <FileCheck size={14} />
              Process Data
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearData}
              className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              <X size={14} />
              Clear Data
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className="p-6 border-2 border-dashed border-neutral-border rounded-lg text-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="mb-3">
            <Upload className="h-8 w-8 mx-auto text-neutral-text" />
          </div>
          <p className="text-sm text-neutral-text mb-4">
            Drag & drop your CSV file here, or click to browse
          </p>
          <Button 
            onClick={handleButtonClick}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Select CSV File"}
          </Button>
          
          {error && (
            <div className="mt-3 text-sm flex items-center text-red-500">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      )}
      
      {/* CSV Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              CSV Preview: {type === 'annual' ? 'Annual' : type === 'monthly-e' ? `${month} Employee` : `${month} Business`} Data
            </DialogTitle>
            <DialogDescription>
              {csvData && csvData.length > 0 
                ? `Showing ${csvData.length} rows of data. Please validate before processing.` 
                : 'No data available'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="csv" className="w-full" value={previewTab} onValueChange={(val) => setPreviewTab(val as any)}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="csv">CSV Data</TabsTrigger>
              <TabsTrigger value="validate">Validation Report</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {previewTab === 'csv' && (
            <ScrollArea className="flex-1 w-full overflow-auto h-[450px]">
              {csvData && csvData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {Object.keys(csvData[0] || {}).map((header, index) => (
                          <th key={index} className="text-left p-2 text-xs font-medium text-muted-foreground border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 100).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                          {Object.entries(row).map(([key, value], cellIndex) => (
                            <td key={cellIndex} className="p-2 text-xs border-b border-muted">
                              {key === 'Line Item' 
                                ? <span className="font-medium">{value}</span> 
                                : value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {csvData.length > 100 && (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      Showing first 100 rows of {csvData.length} total rows
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  No data available to preview
                </div>
              )}
            </ScrollArea>
          )}
          
          {previewTab === 'validate' && validationResults && (
            <ScrollArea className="flex-1 w-full overflow-auto h-[450px]">
              <div className="p-4">
                <div className="mb-4 flex items-center">
                  <Badge className={validationResults.isValid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                    {validationResults.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                  <span className="ml-2 text-sm">
                    {validationResults.isValid 
                      ? 'CSV structure is valid' 
                      : 'CSV has validation errors that need to be fixed'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border rounded-md p-3">
                    <h3 className="font-medium mb-2">File Statistics</h3>
                    <ul className="space-y-1 text-sm">
                      <li>Rows: {validationResults.stats.rowCount || 0}</li>
                      <li>Columns: {validationResults.stats.columnCount || 0}</li>
                      {validationResults.stats.hasLineItem && (
                        <li>Line Item Column: <span className="text-green-600">Present</span></li>
                      )}
                      {validationResults.stats.hasEntityColumns && (
                        <li>Entity Columns: <span className="text-green-600">Present</span> ({validationResults.stats.entityColumns?.length || 0})</li>
                      )}
                      {validationResults.stats.hasSummaryColumn && (
                        <li>Summary Column: <span className="text-green-600">Present</span> ({validationResults.stats.summaryColumn})</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h3 className="font-medium mb-2">Key Content</h3>
                    {validationResults.stats.lineItemValues && validationResults.stats.lineItemValues.length > 0 ? (
                      <div className="text-sm">
                        <p className="mb-1">Sample line items:</p>
                        <ul className="space-y-1 pl-4 list-disc text-xs text-muted-foreground">
                          {validationResults.stats.lineItemValues.slice(0, 5).map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No line items found</p>
                    )}
                    
                    {validationResults.stats.entityColumns && validationResults.stats.entityColumns.length > 0 && (
                      <div className="mt-3 text-sm">
                        <p className="mb-1">Entity columns:</p>
                        <div className="flex flex-wrap gap-1">
                          {validationResults.stats.entityColumns.slice(0, 5).map((col: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {col}
                            </Badge>
                          ))}
                          {validationResults.stats.entityColumns.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{validationResults.stats.entityColumns.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {validationResults.errors && validationResults.errors.length > 0 && (
                  <div className="mb-4 border border-red-200 rounded-md p-3 bg-red-50">
                    <h3 className="font-medium text-red-700 mb-2">Validation Errors</h3>
                    <ul className="space-y-1 text-sm text-red-600 list-disc pl-5">
                      {validationResults.errors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResults.warnings && validationResults.warnings.length > 0 && (
                  <div className="mb-4 border border-amber-200 rounded-md p-3 bg-amber-50">
                    <h3 className="font-medium text-amber-700 mb-2">Warnings</h3>
                    <ul className="space-y-1 text-sm text-amber-600 list-disc pl-5">
                      {validationResults.warnings.map((warning: string, i: number) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2">
            <div className="flex-1">
              {validationResults.errors && validationResults.errors.length > 0 && (
                <p className="text-xs text-red-500 mb-2">
                  Please fix errors before processing
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(false)}
              >
                Close
              </Button>
              <Button 
                variant="default" 
                onClick={() => setShowProcessDialog(true)}
                disabled={!validationResults.isValid || validationResults.errors.length > 0}
                className="bg-green-600 hover:bg-green-700"
              >
                Process Data
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Process Confirmation Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process CSV Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to process this data? This will:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li>Extract hierarchical structure from line items</li>
                <li>Calculate financial metrics for this {type === 'annual' ? 'year' : 'month'}</li>
                <li>Make the data available across all dashboards</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          
          {processStatus === 'error' && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 my-2">
              <p className="font-medium">Processing failed</p>
              <p>There was an error processing this data. Please try again or contact support.</p>
            </div>
          )}
          
          {processStatus === 'success' && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 my-2 flex items-center">
              <Check className="mr-2 h-5 w-5" />
              <p className="font-medium">Data processed successfully!</p>
            </div>
          )}
          
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
              disabled={isProcessing || processStatus === 'success'}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processing..." : "Process Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
