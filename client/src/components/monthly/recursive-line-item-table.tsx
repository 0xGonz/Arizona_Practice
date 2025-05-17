import React from 'react';
import { cn } from '@/lib/utils';

// Format currency values for display
const formatCurrency = (value: number): string => {
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
  isTotal?: boolean;
  summaryValue: number;
  entityValues: Record<string, number>;
  children?: LineItem[];
}

interface RecursiveLineItemTableProps {
  data: LineItem[];
  entityColumns: string[];
  summaryColumn?: string;
}

export default function RecursiveLineItemTable({ 
  data, 
  entityColumns,
  summaryColumn = undefined
}: RecursiveLineItemTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-neutral-500">No data available.</p>
      </div>
    );
  }
  
  // Recursive component to render a line item row and its children
  const LineItemRow = ({ item, level = 0 }: { item: LineItem; level?: number }) => {
    const indentPadding = level * 20; // 20px per level
    const isTotal = item.isTotal || item.name.toLowerCase().includes('total');
    
    return (
      <>
        <tr className={cn(
          "border-b border-neutral-border hover:bg-muted/10 transition-colors",
          isTotal ? "font-semibold bg-muted/20" : "bg-card"
        )}>
          <td 
            className="py-2 px-4 text-left font-medium whitespace-nowrap" 
            style={{ paddingLeft: `${indentPadding + 16}px` }}
          >
            {item.name}
          </td>
          
          {entityColumns.map(entity => (
            <td key={`${item.id}-${entity}`} className="py-2 px-4 text-right whitespace-nowrap">
              {formatCurrency(item.entityValues?.[entity] || 0)}
            </td>
          ))}
          
          {summaryColumn !== 'All Employees' && (
            <td className="py-2 px-4 text-right font-medium whitespace-nowrap">
              {formatCurrency(item.summaryValue || 0)}
            </td>
          )}
        </tr>
        
        {/* Render children recursively */}
        {item.children && item.children.map(child => (
          <LineItemRow key={child.id} item={child} level={level + 1} />
        ))}
      </>
    );
  };
  
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full table-auto min-w-[800px]">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 text-left font-medium whitespace-nowrap">Line Item</th>
              {entityColumns.map(entity => (
                <th key={entity} className="py-3 px-4 text-right font-medium whitespace-nowrap">{entity}</th>
              ))}
              {summaryColumn !== 'All Employees' && (
                <th className="py-3 px-4 text-right font-medium whitespace-nowrap">
                  {summaryColumn || 'Total'}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <LineItemRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}