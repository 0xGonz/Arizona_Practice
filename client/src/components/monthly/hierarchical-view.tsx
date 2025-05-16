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

// Interface definitions for hierarchical line items
interface LineItem {
  id: string;
  name: string;
  depth: number;
  originalLineItem?: string;
  isTotal?: boolean;
  values?: Record<string, number>;
  entityValues?: Record<string, number>;
  summaryValue?: number;
  children?: LineItem[];
}

interface HierarchicalViewProps {
  data: LineItem[] | any[];
  columnHeaders: string[];
  isNested?: boolean;
}

export default function HierarchicalView({ data, columnHeaders, isNested = false }: HierarchicalViewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No data available for this month.</p>
      </div>
    );
  }

  // Function to determine the indentation level from a line item string
  const getLineItemDepth = (lineItem: string): number => {
    if (!lineItem) return 0;
    
    // Count leading spaces to determine depth
    let leadingSpaces = 0;
    for (let i = 0; i < lineItem.length; i++) {
      if (lineItem[i] === ' ') {
        leadingSpaces++;
      } else {
        break;
      }
    }
    
    // Convert space count to hierarchy level (2 spaces = 1 level)
    return Math.floor(leadingSpaces / 2);
  };

  // Process items based on whether they're already in nested format or need processing
  let processedItems: LineItem[] = [];
  
  if (isNested) {
    // Data is already in the proper nested format
    processedItems = data as LineItem[];
  } else {
    // Process raw data to create LineItems with depth info
    processedItems = (data as any[])
      .filter(row => row['Line Item'] !== undefined)
      .map(row => {
        // Keep the original line item string exactly as it appears in CSV
        const originalLineItem = row['Line Item'];
        
        // Calculate depth based on leading spaces
        const depth = getLineItemDepth(originalLineItem);
        
        // For display, we'll trim the name but preserve the full structure
        const name = originalLineItem.trim();
        const isTotal = name.toLowerCase().includes('total');
        
        // Calculate values for each provider column directly from row data
        const values: Record<string, number> = {};
        columnHeaders.forEach(header => {
          // Only parse if the cell has a value
          if (row[header] !== undefined && row[header] !== '') {
            values[header] = parseFinancialValue(row[header]);
          } else {
            values[header] = 0;
          }
        });
        
        // Check for a total column (either named or empty column)
        if (row[''] !== undefined) {
          values['Total'] = parseFinancialValue(row['']);
        } else {
          // Sum the values if no total column exists
          values['Total'] = columnHeaders.reduce((sum, header) => sum + (values[header] || 0), 0);
        }
        
        return {
          id: `${name}-${depth}-${Math.random().toString(36).substring(2, 9)}`,
          name,
          depth,
          originalLineItem,
          isTotal,
          values,
          children: []
        };
      });
  }

  // Build a tree structure from the flat list
  const buildTree = (items: LineItem[]): LineItem[] => {
    const root: LineItem[] = [];
    
    // If this is already nested data with children property, return as is
    if (isNested && items.length > 0 && items[0].children) {
      return items;
    }
    const stack: LineItem[] = [];
    
    items.forEach(item => {
      // Pop items from the stack until we find a parent or reach root
      while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        // This is a top-level item
        root.push(item);
      } else {
        // Add as a child to the current parent
        const parent = stack[stack.length - 1];
        // Ensure the parent has a children array
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(item);
      }
      
      // Add current item to the stack
      stack.push(item);
    });
    
    return root;
  };

  const hierarchicalItems = buildTree(processedItems);

  // Recursive function to render a line item and its children
  const renderLineItem = (item: LineItem, index: number) => {
    const indentPadding = item.depth * 16; // 16px per level
    
    // Handle different data formats (new structure vs old structure)
    const getValueForColumn = (columnName: string): number => {
      // For new structure with entityValues
      if (item.entityValues && item.entityValues[columnName] !== undefined) {
        return item.entityValues[columnName];
      }
      
      // For old structure with values
      if (item.values && item.values[columnName] !== undefined) {
        return item.values[columnName];
      }
      
      // Fallback
      return 0;
    };
    
    // Get total/summary value
    const getTotalValue = (): number => {
      // If we have a summary value directly
      if (item.summaryValue !== undefined) {
        return item.summaryValue;
      }
      
      // If we have a 'Total' in values object
      if (item.values && item.values['Total'] !== undefined) {
        return item.values['Total'];
      }
      
      // Calculate from entity values
      if (item.entityValues) {
        return Object.values(item.entityValues).reduce((sum, value) => sum + value, 0);
      }
      
      return 0;
    };
    
    const isItemTotal = item.isTotal || (item.name && item.name.toLowerCase().includes('total'));
    
    return (
      <React.Fragment key={item.id}>
        <tr className={cn(
          "border-b",
          isItemTotal ? "font-semibold bg-muted/20" : "bg-card"
        )}>
          <td 
            className="py-2 px-4 text-left" 
            style={{ paddingLeft: `${indentPadding + 16}px` }}
          >
            {item.name}
          </td>
          
          {columnHeaders.map(header => (
            <td key={`${item.id}-${header}`} className="py-2 px-4 text-right">
              {formatCurrency(getValueForColumn(header))}
            </td>
          ))}
          
          <td className="py-2 px-4 text-right font-medium">
            {formatCurrency(getTotalValue())}
          </td>
        </tr>
        
        {/* Render children recursively */}
        {item.children && item.children.map((child, idx) => renderLineItem(child, idx))}
      </React.Fragment>
    );
  };

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
            {hierarchicalItems.map((item, idx) => renderLineItem(item, idx))}
          </tbody>
        </table>
      </div>
    </div>
  );
}