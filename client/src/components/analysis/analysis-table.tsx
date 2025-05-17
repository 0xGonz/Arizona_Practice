import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface AnalysisTableProps {
  data: {
    month: string;
    revenue: number;
    expense: number;
    net: number;
    marginPct?: number;
  }[];
  entityType: 'employee' | 'business';
  isLoading?: boolean;
}

export function AnalysisTable({ data, entityType, isLoading = false }: AnalysisTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse">
          <div className="h-64 bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  // Sort data by month (assuming month names)
  const monthOrder = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  const sortedData = [...data].sort((a, b) => {
    const aIndex = monthOrder.indexOf(a.month.toLowerCase());
    const bIndex = monthOrder.indexOf(b.month.toLowerCase());
    return aIndex - bIndex;
  });
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format percentage values
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };
  
  // Calculate year-to-date totals
  const ytdTotals = sortedData.reduce((acc, item) => {
    return {
      revenue: acc.revenue + Number(item.revenue),
      expense: acc.expense + Number(item.expense),
      net: acc.net + Number(item.net)
    };
  }, { revenue: 0, expense: 0, net: 0 });
  
  // Calculate overall margin
  const overallMargin = ytdTotals.revenue ? (ytdTotals.net / ytdTotals.revenue) * 100 : 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {entityType === 'employee' ? 'Employee Performance by Month' : 'Business Performance by Month'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net Income</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.month.charAt(0).toUpperCase() + item.month.slice(1)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.expense)}</TableCell>
                  <TableCell className={`text-right ${item.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(item.net)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(item.marginPct || (item.revenue ? (item.net / item.revenue) * 100 : 0))}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* YTD row */}
              <TableRow className="bg-muted/50 font-medium">
                <TableCell>Year to Date</TableCell>
                <TableCell className="text-right">{formatCurrency(ytdTotals.revenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(ytdTotals.expense)}</TableCell>
                <TableCell className={`text-right ${ytdTotals.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(ytdTotals.net)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(overallMargin)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}