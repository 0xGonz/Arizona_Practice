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
      complete: (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            setError(`CSV parsing error: ${results.errors[0].message}`);
            setIsUploading(false);
            return;
          }

          // Validate CSV structure based on type
          const data = results.data as Record<string, string>[];
          if (!validateCSVStructure(type, data)) {
            setError('CSV format does not match the expected structure');
            setIsUploading(false);
            return;
          }

          // Ensure month is standardized to lowercase
          const monthKey = month ? month.toLowerCase().trim() : '';
          
          // Process the CSV data with standardized month key
          processCSVData(type, data, monthKey);
          
          // Log for debugging
          console.log(`CSV Upload processed for ${type}${monthKey ? ` (${monthKey})` : ''}`);
          
          // Update upload status with standardized month key
          if (type === 'annual') {
            setUploadStatus({ annual: true });
          } else if (type === 'monthly-e' && monthKey) {
            // For monthly-e, ensure both e and o properties exist
            const updatedMonthStatus = { 
              e: true,
              // Preserve existing 'o' value or set to false
              o: (uploadStatus.monthly[monthKey]?.o || false) 
            };
            setUploadStatus({ monthly: { [monthKey]: updatedMonthStatus } });
          } else if (type === 'monthly-o' && monthKey) {
            // For monthly-o, ensure both e and o properties exist
            const updatedMonthStatus = { 
              // Preserve existing 'e' value or set to false
              e: (uploadStatus.monthly[monthKey]?.e || false),
              o: true 
            };
            setUploadStatus({ monthly: { [monthKey]: updatedMonthStatus } });
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
