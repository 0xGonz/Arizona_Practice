import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from './KpiCard';

interface ProfitabilityChartProps {
  data: Array<{
    month: string;
    revenue: number;
    payroll: number;
    payrollPct?: number;
  }>;
  title?: string;
}

export function ProfitabilityChart({ 
  data, 
  title = 'Revenue vs Payroll'
}: ProfitabilityChartProps) {
  // Process data to ensure it's sorted by month and calculate payroll percentage
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const monthOrder = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    
    // Sort and calculate payroll percentage
    return [...data].sort((a, b) => {
      const monthA = a.month.toLowerCase();
      const monthB = b.month.toLowerCase();
      
      return (monthOrder[monthA as keyof typeof monthOrder] || 0) - 
             (monthOrder[monthB as keyof typeof monthOrder] || 0);
    }).map(item => ({
      ...item,
      // Calculate percentage if not already provided
      payrollPct: item.payrollPct || (
        item.revenue > 0 
          ? (item.payroll / item.revenue) * 100 
          : 0
      )
    }));
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
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth} 
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`} 
                orientation="left"
              />
              <YAxis 
                yAxisId="right"
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                orientation="right"
                domain={[0, 'dataMax']}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue') return [formatCurrency(value as number), 'Revenue'];
                  if (name === 'payroll') return [formatCurrency(value as number), 'Payroll'];
                  return [`${(value as number).toFixed(1)}%`, 'Payroll %'];
                }}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="revenue" 
                name="Revenue" 
                fill="#3b82f6" 
              />
              <Bar 
                yAxisId="left"
                dataKey="payroll" 
                name="Payroll" 
                fill="#f97316" 
              />
              <Line 
                yAxisId="right"
                dataKey="payrollPct" 
                name="Payroll %" 
                stroke="#6b7280"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}