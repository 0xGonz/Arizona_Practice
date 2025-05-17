import React from 'react';
import { parseFinancialValue } from '@/lib/csv-parser';
import { cn } from '@/lib/utils';
import { MonthlyCSVRow } from '@/types';

// Format currency values for display
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

interface RawCSVViewProps {
  data: MonthlyCSVRow[];
}

export default function RawCSVView({ data }: RawCSVViewProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No raw data available for this month.</p>
      </div>
    );
  }

  // Extract headers from the first row (excluding Line Item)
  const firstRow = data[0];
  const headers = Object.keys(firstRow).filter(header => header !== 'Line Item');
  
  // Find summary column if it exists (typically "All Employees")
  const summaryColumn = headers.find(h => 
    typeof h === 'string' && (h.includes('All') || h === 'Summary' || h === '')
  );
  
  // Build column headers array
  const displayHeaders = summaryColumn 
    ? [
        ...headers.filter(h => h !== summaryColumn && h !== ''), // Entity columns
        summaryColumn,                                     // Summary column (e.g., "All Employees")
        'Total (Raw)'                                      // Add a raw total column
      ]
    : [
        ...headers.filter(h => h !== ''),                  // All headers excluding empty
        'Total (Raw)'                                      // Add a total column
      ];

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Line Item</th>
              {displayHeaders.map(header => (
                <th key={header} className="py-3 px-4 text-right font-medium">
                  {header === '' ? 'Total' : header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              // Calculate depth based on spaces in the line item
              const lineItem = row['Line Item'] || '';
              const leadingSpaces = lineItem.length - lineItem.trimStart().length;
              const depth = Math.floor(leadingSpaces / 2);
              const indentPadding = depth * 16; // 16px per level of indent
              
              // Determine if this is a total line
              const name = lineItem.trim();
              const isTotal = name.toLowerCase().includes('total') || false;
              
              // Calculate a raw total from all numerical values
              const rowTotal = displayHeaders
                .filter(header => header !== 'Total (Raw)') // Exclude our added total column
                .reduce((sum, header) => {
                  // Skip empty or invalid values
                  const rawHeaderValue = row[header];
                  if (rawHeaderValue === undefined || rawHeaderValue === null || rawHeaderValue === '') return sum;
                  
                  try {
                    // For numbers or number-like strings
                    const value = row[header];
                  if (typeof value === 'number') {
                      return sum + (isNaN(value) ? 0 : value);
                    } else {
                      // For formatted strings (like "$1,234.56")
                      return sum + parseFinancialValue(String(row[header]).trim());
                    }
                  } catch {
                    return sum;
                  }
                }, 0);
              
              return (
                <tr 
                  key={`${index}-${name}`}
                  className={cn(
                    "border-b",
                    isTotal ? "font-semibold bg-muted/20" : "bg-card"
                  )}
                >
                  <td 
                    className="py-2 px-4 text-left" 
                    style={{ paddingLeft: `${indentPadding + 16}px` }}
                  >
                    {name}
                  </td>
                  
                  {displayHeaders.map(header => {
                    // For the raw total column we show our calculated total
                    if (header === 'Total (Raw)') {
                      return (
                        <td key={`${index}-${header}`} className="py-2 px-4 text-right font-medium">
                          {formatCurrency(rowTotal)}
                        </td>
                      );
                    }
                    
                    // For other columns, show the actual value from CSV
                    const value = row[header];
                    let displayValue: string;
                    
                    if (value === undefined || value === null || value === '') {
                      displayValue = '-';
                    } else if (typeof value === 'number') {
                      displayValue = formatCurrency(value);
                    } else {
                      // Try to parse as a financial value
                      try {
                        const parsedValue = parseFinancialValue(String(value).trim());
                        displayValue = formatCurrency(parsedValue);
                      } catch {
                        // If parsing fails, just display the original string
                        displayValue = String(value);
                      }
                    }
                    
                    return (
                      <td key={`${index}-${header}`} className="py-2 px-4 text-right">
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}