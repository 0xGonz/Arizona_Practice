import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFilterStore } from '@/store/filter-store';

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
  originalLineItem?: string; // Added to preserve original indentation
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
  'Net Income',
  'Net Income (Loss)'
];

// Key metrics to highlight with specific colors
const HIGHLIGHT_COLORS = {
  'Total Revenue': 'bg-blue-50 border-l-4 border-blue-200',
  'Total Operating Expenses': 'bg-red-50 border-l-4 border-red-200',
  'Net Income': 'bg-green-50 border-l-4 border-green-200',
  'Net Income (Loss)': 'bg-green-50 border-l-4 border-green-200'
};

export default function RecursiveLineItemTable({ 
  data, 
  entityColumns,
  summaryColumn = undefined
}: RecursiveLineItemTableProps) {
  // Use the persistent filter store instead of local state
  const { 
    searchTerm, 
    showOnlyNegative, 
    showSimplified,
    setSearchTerm,
    setShowOnlyNegative,
    setShowSimplified,
    resetFilters
  } = useFilterStore();
  
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
    
    // Determine how to display the line item based on depth
    const getLineItemDisplay = () => {
      if (item.depth === 0) {
        // Top level items - use bold text
        return <span className="font-bold">{item.name}</span>;
      } else if (isTotal) {
        // Total items - use semi-bold text regardless of depth
        return <span className="font-semibold">{item.name}</span>;
      } else if (item.depth === 1) {
        // Primary categories - use medium weight text
        return <span className="font-medium">{item.name}</span>;
      } else if (item.depth >= 3) {
        // Deep nested items - use smaller, lighter text with a bullet
        return (
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5 inline-block"></span>
            <span className="text-gray-600">{item.name}</span>
          </span>
        );
      } else {
        // Standard nested items - use small indentation marker
        return (
          <span className="flex items-center">
            <span className="w-1 h-4 border-l border-b border-gray-300 mr-1.5 inline-block"></span>
            {item.name}
          </span>
        );
      }
    };
    
    // Check if this is a key metric that needs highlighting
    const isKeyMetric = Object.keys(HIGHLIGHT_COLORS).includes(item.name);
    const highlightClass = isKeyMetric ? HIGHLIGHT_COLORS[item.name as keyof typeof HIGHLIGHT_COLORS] : '';
    
    return (
      <>
        <tr className={cn(
          "border-b border-neutral-border hover:bg-muted/10 transition-colors",
          isTotal && !isKeyMetric ? "font-semibold bg-muted/20" : "bg-card",
          item.depth === 0 ? "bg-gray-50" : "",
          highlightClass // Apply highlight color if it's a key metric
        )}>
          <td 
            className="py-1 px-2 text-left whitespace-nowrap text-sm" 
            style={{ paddingLeft: `${indentPadding + 16}px` }}
          >
            {getLineItemDisplay()}
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
            className="data-[state=checked]:bg-red-500"
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
            className="data-[state=checked]:bg-blue-500"
          />
          <Label htmlFor="show-simplified" className="text-xs cursor-pointer">
            Show Simplified
          </Label>
        </div>
        <Button
          variant="outline" 
          size="sm"
          onClick={resetFilters}
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