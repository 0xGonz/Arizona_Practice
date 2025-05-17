import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyBarChartProps {
  data: {
    month: string;
    revenue: number;
    expense: number;
    net: number;
  }[];
  isLoading?: boolean;
}

export function MonthlyBarChart({ data, isLoading = false }: MonthlyBarChartProps) {
  // Transform month names for better display
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      ...item,
      // Convert month to short name (Jan, Feb, etc.)
      month: item.month.charAt(0).toUpperCase() + item.month.slice(1, 3)
    }));
  }, [data]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Monthly Financial Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-80 animate-pulse">
          <div className="h-full w-full bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  // Format dollar values for tooltip
  const formatDollar = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="text-sm font-medium">{
            // Convert short month name back to full name
            data.find(item => item.month.toLowerCase().startsWith(label.toLowerCase()))?.month
          }</p>
          <p className="text-sm text-emerald-600">
            Revenue: {formatDollar(payload[0].value)}
          </p>
          <p className="text-sm text-amber-600">
            Expenses: {formatDollar(payload[1].value)}
          </p>
          <p className="text-sm font-medium text-blue-600">
            Net: {formatDollar(payload[2].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Monthly Financial Performance</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            <Bar 
              dataKey="revenue" 
              name="Revenue" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="expense" 
              name="Expenses" 
              fill="#f59e0b" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="net" 
              name="Net Income" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}