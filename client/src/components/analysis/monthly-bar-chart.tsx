import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyBarChartProps {
  data: {
    month: string;
    revenue: number;
    expense: number;
    net: number;
  }[];
  groupMode?: 'stack' | 'group';
  title?: string;
  isLoading?: boolean;
}

export function MonthlyBarChart({ 
  data, 
  groupMode = 'group', 
  title = 'Monthly Financial Performance',
  isLoading = false
}: MonthlyBarChartProps) {
  
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
            <p className="text-gray-400">Loading chart data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[350px] w-full bg-gray-50 rounded-md flex items-center justify-center">
            <p className="text-gray-500">No data available for the selected period</p>
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? 
                    `${(value / 1000).toFixed(0)}K` : value}`} 
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), '']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                {groupMode === 'stack' ? (
                  <>
                    <Bar dataKey="revenue" name="Revenue" stackId="a" fill="#4f46e5" />
                    <Bar dataKey="expense" name="Expenses" stackId="a" fill="#ef4444" />
                    <Bar dataKey="net" name="Net Income" fill="#10b981" />
                  </>
                ) : (
                  <>
                    <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" />
                    <Bar dataKey="expense" name="Expenses" fill="#ef4444" />
                    <Bar dataKey="net" name="Net Income" fill="#10b981" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}