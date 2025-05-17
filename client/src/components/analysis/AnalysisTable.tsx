import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from './KpiCard';

interface AnalysisTableItem {
  month: string;
  revenue: number;
  expense: number;
  net: number;
  marginPct?: number;
}

interface AnalysisTableProps {
  data: AnalysisTableItem[];
  title?: string;
}

export function AnalysisTable({ data, title = 'Monthly Performance' }: AnalysisTableProps) {
  // Sort data by month for consistent display
  const sortedData = [...data].sort((a, b) => {
    const monthOrder = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    
    const monthA = a.month.toLowerCase();
    const monthB = b.month.toLowerCase();
    
    return (monthOrder[monthA as keyof typeof monthOrder] || 0) - 
           (monthOrder[monthB as keyof typeof monthOrder] || 0);
  });

  // Calculate totals
  const totals = sortedData.reduce(
    (acc, curr) => {
      acc.revenue += curr.revenue;
      acc.expense += curr.expense;
      acc.net += curr.net;
      return acc;
    },
    { revenue: 0, expense: 0, net: 0 }
  );

  // Calculate average margin
  const avgMargin = totals.revenue > 0 
    ? (totals.net / totals.revenue) * 100 
    : 0;

  // Format month for display
  const formatMonth = (month: string) => {
    return month.charAt(0).toUpperCase() + month.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net Income</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, i) => {
                const margin = item.marginPct || (item.revenue > 0 ? (item.net / item.revenue) * 100 : 0);
                const isNegative = item.net < 0;
                
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{formatMonth(item.month)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.expense)}</TableCell>
                    <TableCell 
                      className={`text-right ${isNegative ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {formatCurrency(item.net)}
                    </TableCell>
                    <TableCell 
                      className={`text-right ${margin < 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Totals row */}
              <TableRow className="font-medium bg-gray-50">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.revenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.expense)}</TableCell>
                <TableCell 
                  className={`text-right ${totals.net < 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {formatCurrency(totals.net)}
                </TableCell>
                <TableCell 
                  className={`text-right ${avgMargin < 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {avgMargin.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}