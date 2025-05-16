import { useState, useRef } from "react";
import { CSVType } from "@/types";
import { Button } from "@/components/ui/button";
import { Upload, Check, AlertCircle } from "lucide-react";
import { useStore } from "@/store/data-store";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

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
  const { processCSVData, setUploadStatus, uploadStatus } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    // Check file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setIsUploading(false);
      return;
    }

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
          
          // Validate CSV structure based on type
          if (!validateCSVStructure(type, data)) {
            setError('CSV format does not match the expected structure - needs a Line Item column');
            setIsUploading(false);
            return;
          }

          // Ensure month is standardized to lowercase
          const monthKey = month ? month.toLowerCase().trim() : '';
          
          try {
            // Log the data for debugging
            console.log(`Attempting to process ${type} CSV data for ${monthKey || 'annual'}:`, data.length, "rows");
            
            // Special handling for monthly data
            if ((type === 'monthly-e' || type === 'monthly-o') && monthKey) {
              // Check if the data has a valid structure with Line Item column
              let hasLineItemColumn = false;
              for (const row of data) {
                if ('Line Item' in row) {
                  hasLineItemColumn = true;
                  break;
                }
              }
              
              if (!hasLineItemColumn) {
                throw new Error("CSV file is missing the 'Line Item' column required for monthly data");
              }
            }
            
            // Process the CSV data with standardized month key
            processCSVData(type, data, monthKey);
            
            // Log for debugging
            console.log(`CSV Upload processed for ${type}${monthKey ? ` (${monthKey})` : ''}`);
            
            // Update upload status with standardized month key
            if (type === 'annual') {
              setUploadStatus({ annual: true });
            } else if (type === 'monthly-e' && monthKey) {
              // Create a fresh monthly status object if needed
              const currentMonthly = uploadStatus.monthly || {};
              
              // For monthly-e, ensure both e and o properties exist
              const updatedMonthStatus = { 
                e: true,
                // Preserve existing 'o' value or set to false
                o: (currentMonthly[monthKey]?.o) || false 
              };
              
              console.log(`Setting monthly-e upload status for ${monthKey}:`, updatedMonthStatus);
              setUploadStatus({
                monthly: {
                  ...currentMonthly,
                  [monthKey]: updatedMonthStatus
                }
              });
            } else if (type === 'monthly-o' && monthKey) {
              // Create a fresh monthly status object if needed
              const currentMonthly = uploadStatus.monthly || {};
              
              // For monthly-o, ensure both e and o properties exist
              const updatedMonthStatus = { 
                // Preserve existing 'e' value or set to false
                e: (currentMonthly[monthKey]?.e) || false,
                o: true 
              };
              
              console.log(`Setting monthly-o upload status for ${monthKey}:`, updatedMonthStatus);
              setUploadStatus({
                monthly: {
                  ...currentMonthly,
                  [monthKey]: updatedMonthStatus
                }
              });
            }
          } catch (processError) {
            console.error("Error during CSV processing:", processError);
            setError(`Error processing CSV: ${processError.message || "Unknown error"}`);
            setIsUploading(false);
            return;
          }

          // Success notification
          toast({
            title: "CSV Uploaded Successfully",
            description: `Your ${type} CSV file has been processed.`,
          });

          onUploadComplete();
          setIsUploading(false);
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

  const validateCSVStructure = (type: CSVType, data: Record<string, string>[]) => {
    if (data.length === 0) return false;

    const firstRow = data[0];
    
    // Check for the "Line Item" column which should be present in all CSV types
    if (!("Line Item" in firstRow)) return false;

    // Additional validations could be added here based on type
    // For example, checking for monthly columns in annual CSV,
    // or checking for employee columns in monthly-e CSV

    return true;
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
        <div className="p-4 border-2 border-dashed border-green-200 rounded-lg bg-green-50 text-center">
          <div className="flex items-center justify-center mb-2">
            <Check className="h-6 w-6 text-green-500 mr-2" />
            <span className="font-medium text-green-800">Uploaded Successfully</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick}
            className="mt-2"
          >
            Replace File
          </Button>
        </div>
      ) : (
        <div className="p-6 border-2 border-dashed border-neutral-border rounded-lg text-center">
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
    </div>
  );
}
