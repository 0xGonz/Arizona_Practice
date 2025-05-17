import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from './KpiCard';

interface MonthlyBarChartProps {
  data: Array<{
    month: string;
    revenue: number;
    expense: number;
    net: number;
  }>;
  title?: string;
  groupMode?: 'stack' | 'group';
}

export function MonthlyBarChart({ 
  data,
  title = 'Monthly Revenue vs Expenses',
  groupMode = 'group' 
}: MonthlyBarChartProps) {
  // Process data to ensure it's sorted by month
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const monthOrder = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    
    // Sort data by month (chronologically)
    return [...data].sort((a, b) => {
      const monthA = a.month.toLowerCase();
      const monthB = b.month.toLowerCase();
      
      return (monthOrder[monthA as keyof typeof monthOrder] || 0) - 
             (monthOrder[monthB as keyof typeof monthOrder] || 0);
    });
  }, [data]);
  
  // Format month names to be more readable
  const formatMonth = (month: string) => {
    // Convert 'january' to 'Jan', etc.
    return month.charAt(0).toUpperCase() + month.slice(1, 3);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth} 
              />
              <YAxis 
                tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`} 
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue') return [formatCurrency(value as number), 'Revenue'];
                  if (name === 'expense') return [formatCurrency(value as number), 'Expenses'];
                  return [formatCurrency(value as number), 'Net Income'];
                }}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="revenue" 
                name="Revenue" 
                fill="#3b82f6" 
                stackId={groupMode === 'stack' ? 'a' : undefined} 
              />
              <Bar 
                dataKey="expense" 
                name="Expenses" 
                fill="#ef4444" 
                stackId={groupMode === 'stack' ? 'a' : undefined} 
              />
              <Bar 
                dataKey="net" 
                name="Net Income" 
                fill="#10b981" 
                stackId={groupMode === 'stack' ? 'b' : undefined} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}