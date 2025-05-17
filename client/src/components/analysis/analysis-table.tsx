import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface AnalysisTableProps {
  data: {
    month: string;
    revenue: number;
    expense: number;
    net: number;
    marginPct?: number;
  }[];
  isLoading?: boolean;
}

export function AnalysisTable({ data, isLoading = false }: AnalysisTableProps) {
  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  // Format percentage value
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Handle CSV export
  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Month', 'Revenue', 'Expenses', 'Net Income', 'Margin %'];
    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.month,
        row.revenue.toFixed(2),
        row.expense.toFixed(2),
        row.net.toFixed(2),
        row.marginPct ? row.marginPct.toFixed(2) : (row.net / row.revenue * 100).toFixed(2)
      ].join(','))
    ];
    const csvContent = csvRows.join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_analysis_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Monthly Financial Data</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={isLoading || data.length === 0}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>
            <div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>
            <div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data available for the selected period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium">Month</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue</th>
                  <th className="px-4 py-2 text-right font-medium">Expenses</th>
                  <th className="px-4 py-2 text-right font-medium">Net Income</th>
                  <th className="px-4 py-2 text-right font-medium">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => {
                  // Calculate margin percentage if not provided
                  const marginPct = row.marginPct !== undefined 
                    ? row.marginPct 
                    : (row.revenue !== 0 ? (row.net / row.revenue) * 100 : 0);
                  
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-left">{row.month}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(row.revenue)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(row.expense)}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        <span className={row.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(row.net)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={marginPct >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatPercentage(marginPct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}