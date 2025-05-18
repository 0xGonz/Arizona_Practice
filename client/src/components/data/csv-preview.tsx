import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CSVPreviewProps {
  data: any[];
  onClose: () => void;
  maxRows?: number;
  title?: string;
  viewAllMessage?: string;
}

/**
 * CSV Preview component with enhanced horizontal scrolling
 * Displays a CSV data preview with proper horizontal scrolling for wide tables
 */
export function CSVPreview({ 
  data, 
  onClose, 
  maxRows = 10,
  title = "Data Preview",
  viewAllMessage = "Visit the dashboard to see full analysis."
}: CSVPreviewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-50 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <h4 className="font-semibold">{title}</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-4 text-neutral-500">
          No data available for preview.
        </div>
      </div>
    );
  }

  // Get column headers from the first row
  const headers = Object.keys(data[0]);
  const slicedData = data.slice(0, maxRows);
  
  return (
    <div className="bg-slate-50 p-4 rounded-lg">
      <div className="flex justify-between mb-2">
        <h4 className="font-semibold">{title}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Container with vertical scrolling */}
      <div className="max-h-80 overflow-y-auto relative">
        {/* Container with horizontal scrolling */}
        <div className="overflow-x-auto pb-4" style={{ maxWidth: '100%' }}>
          <table className="w-auto border-collapse text-sm" style={{ minWidth: '100%' }}>
            <thead>
              <tr className="bg-slate-100 sticky top-0 z-10">
                {headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    className="p-2 text-left border-b font-medium whitespace-nowrap"
                    style={{ minWidth: '150px' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slicedData.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {Object.values(row).map((cell, cellIdx) => (
                    <td 
                      key={cellIdx} 
                      className="p-2 border-b whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {data.length > maxRows && (
        <div className="mt-2 text-sm text-neutral-500 text-center">
          Showing {maxRows} of {data.length} rows. {viewAllMessage}
        </div>
      )}
    </div>
  );
}