import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

// Key financial metrics we want to show in simplified view - exact matches only
const KEY_FINANCIAL_METRICS = [
  'Total Revenue',
  'Total Operating Expenses',
  'Net Income (Loss)'
];

export default function RecursiveLineItemTable({ 
  data, 
  entityColumns,
  summaryColumn = undefined
}: RecursiveLineItemTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyNegative, setShowOnlyNegative] = useState(false);
  const [showSimplified, setShowSimplified] = useState(false);
  
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-neutral-500">No data available.</p>
      </div>
    );
  }
  
  // Filter function to determine if a line item should be displayed
  const shouldDisplayLineItem = (item: LineItem): boolean => {
    // Skip empty rows (empty name or just whitespace)
    if (!item.name || item.name.trim() === '') {
      return false;
    }
    
    // Check if name matches search term (case insensitive)
    const nameMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if matches the negative value filter
    let negativeMatch = true;
    if (showOnlyNegative) {
      // Check if any entity value or summary value is negative
      const hasNegativeEntityValue = Object.values(item.entityValues).some(value => value < 0);
      const hasNegativeSummary = item.summaryValue < 0;
      negativeMatch = hasNegativeEntityValue || hasNegativeSummary;
    }
    
    // Check if it matches the simplified view filter
    let simplifiedMatch = true;
    if (showSimplified) {
      // Use exact matches for the key financial metrics
      const isKeyMetric = KEY_FINANCIAL_METRICS.some(metric => 
        item.name === metric
      );
      simplifiedMatch = isKeyMetric;
    }
    
    return nameMatch && negativeMatch && simplifiedMatch;
  };
  
  // Recursive component to render a line item row and its children
  const LineItemRow = ({ item, level = 0 }: { item: LineItem; level?: number }) => {
    const indentPadding = level * 20; // 20px per level
    const isTotal = item.isTotal || item.name.toLowerCase().includes('total');
    
    // Skip rendering if it doesn't match the filters
    if (!shouldDisplayLineItem(item)) {
      return null;
    }
    
    return (
      <>
        <tr className={cn(
          "border-b border-neutral-border hover:bg-muted/10 transition-colors",
          isTotal ? "font-semibold bg-muted/20" : "bg-card"
        )}>
          <td 
            className="py-1 px-2 text-left font-medium whitespace-nowrap text-sm" 
            style={{ paddingLeft: `${indentPadding + 16}px` }}
          >
            {item.name}
          </td>
          
          {entityColumns.map(entity => {
            const value = item.entityValues?.[entity] || 0;
            const isNegative = value < 0;
            
            return (
              <td 
                key={`${item.id}-${entity}`} 
                className={cn(
                  "py-1 px-2 text-right whitespace-nowrap text-xs",
                  isNegative ? "text-red-600" : ""
                )}
              >
                {formatCurrency(value)}
              </td>
            );
          })}
          
          {summaryColumn !== 'All Employees' && (
            <td 
              className={cn(
                "py-1 px-2 text-right font-medium whitespace-nowrap text-xs",
                (item.summaryValue || 0) < 0 ? "text-red-600" : ""
              )}
            >
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
      <div className="p-2 border-b flex flex-col sm:flex-row items-center gap-3 bg-slate-50">
        <div className="flex-1">
          <Input
            placeholder="Search line items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="text-sm h-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            id="show-negative" 
            checked={showOnlyNegative} 
            onCheckedChange={setShowOnlyNegative} 
          />
          <Label htmlFor="show-negative" className="text-xs cursor-pointer">
            Show Only Negative Values
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            id="show-simplified" 
            checked={showSimplified} 
            onCheckedChange={setShowSimplified} 
          />
          <Label htmlFor="show-simplified" className="text-xs cursor-pointer">
            Show Simplified
          </Label>
        </div>
        <Button
          variant="outline" 
          size="sm"
          onClick={() => {
            setSearchTerm('');
            setShowOnlyNegative(false);
            setShowSimplified(false);
          }}
          className="text-xs h-8"
        >
          Clear Filters
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto min-w-[800px]">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="py-2 px-2 text-left font-medium whitespace-nowrap text-sm">Line Item</th>
              {entityColumns.map(entity => (
                <th key={entity} className="py-2 px-2 text-right font-medium whitespace-nowrap text-xs">{entity}</th>
              ))}
              {summaryColumn !== 'All Employees' && (
                <th className="py-2 px-2 text-right font-medium whitespace-nowrap text-xs">
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