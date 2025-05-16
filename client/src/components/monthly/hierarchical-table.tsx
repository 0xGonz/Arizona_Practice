import React from 'react';
import { parseFinancialValue } from '@/lib/csv-parser';
import { cn } from '@/lib/utils';

// Format currency values for display
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

interface LineItem {
  id: string;
  name: string;
  depth: number;
  children: LineItem[];
  values: Record<string, number>;
  isTotal?: boolean;
}

interface HierarchicalTableProps {
  data: any[];
  columnHeaders: string[];
}

export default function HierarchicalTable({ data, columnHeaders }: HierarchicalTableProps) {
  // Function to determine the indentation level (hierarchy depth) from a line item
  const getLineItemDepth = (lineItem: string): number => {
    if (!lineItem) return 0;
    
    // Count leading spaces to determine hierarchy level
    let leadingSpaces = 0;
    for (let i = 0; i < lineItem.length; i++) {
      if (lineItem[i] === ' ') {
        leadingSpaces++;
      } else {
        break;
      }
    }
    
    // Convert space count to hierarchy depth (roughly 2 spaces per level)
    return Math.floor(leadingSpaces / 2);
  };
  
  // Build the hierarchical line item structure directly from the CSV data
  const buildHierarchy = () => {
    if (!data || data.length === 0) {
      return [];
    }
    
    console.log("Building hierarchy from raw data rows:", data.length);
    
    // Process all rows to get line items with their depth
    const allItems = data
      .filter(row => row['Line Item'] && row['Line Item'].trim() !== '')
      .map(row => {
        const lineItem = row['Line Item'];
        const depth = getLineItemDepth(lineItem);
        const trimmedName = lineItem.trim();
        
        // Add values for each provider column
        const values: Record<string, number> = {};
        
        // Process each column to extract financial value
        columnHeaders.forEach(header => {
          if (row[header] !== undefined) {
            values[header] = parseFinancialValue(row[header]);
          } else {
            values[header] = 0;
          }
        });
        
        // Add total column 
        const emptyCol = row[''] !== undefined ? parseFinancialValue(row['']) : null;
        
        // Use empty column as total if it exists, otherwise sum the columns
        if (emptyCol !== null) {
          values['Total'] = emptyCol;
        } else {
          // Calculate total by summing individual columns
          values['Total'] = columnHeaders.reduce((sum, header) => {
            return sum + (values[header] || 0);
          }, 0);
        }
        
        return {
          id: `${trimmedName}-${depth}-${Math.random().toString(36).substring(2, 9)}`,
          name: trimmedName,
          depth,
          children: [],
          isTotal: trimmedName.toLowerCase().includes('total'),
          values
        };
      });
    
    // Build tree structure
    const result: LineItem[] = [];
    const stack: LineItem[] = [];
    
    // Process each item and build parent-child relationships
    allItems.forEach(item => {
      // Pop items from stack until we find the parent
      while (stack.length > 0) {
        const lastItem = stack[stack.length - 1];
        if (lastItem.depth < item.depth) {
          // Found parent
          lastItem.children.push(item);
          break;
        } else {
          // Remove items until we find a parent
          stack.pop();
        }
      }
      
      // If stack is empty, add to root result
      if (stack.length === 0) {
        result.push(item);
      }
      
      // Add current item to stack
      stack.push(item);
    });
    
    console.log("Built hierarchy with", result.length, "top-level items");
    return result;
  };

  const hierarchyData = buildHierarchy();
  
  // Helper function to render child rows recursively
  const renderChildRow = (item: LineItem, index: number) => {
    const isTotal = item.isTotal;
    
    return (
      <React.Fragment key={`${item.id}-${index}`}>
        <tr className={cn(
          "border-b border-neutral-border",
          isTotal ? "font-semibold bg-muted/20" : "bg-neutral-bg"
        )}>
          <td 
            className="py-3 px-4"
            style={{ paddingLeft: `${item.depth * 16 + 16}px` }}
          >
            {item.name}
          </td>
          {columnHeaders.map(header => (
            <td key={`${item.id}-${header}`} className="text-right py-3 px-4 numeric">
              {formatCurrency(item.values[header] || 0)}
            </td>
          ))}
          <td className="text-right py-3 px-4 numeric">
            {formatCurrency(item.values.Total || 0)}
          </td>
        </tr>
        
        {/* Recursively render children */}
        {item.children.map((child, childIndex) => renderChildRow(child, childIndex))}
      </React.Fragment>
    );
  };
  
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-neutral-500">No data available.</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Line Item</th>
              {columnHeaders.map(header => (
                <th key={header} className="py-3 px-4 text-right font-medium">{header}</th>
              ))}
              <th className="py-3 px-4 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {hierarchyData.map((item, index) => {
              return renderChildRow(item, index);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}