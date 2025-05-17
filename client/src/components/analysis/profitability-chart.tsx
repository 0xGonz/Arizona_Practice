import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface ProfitabilityChartProps {
  data: {
    month: string;
    revenue: number;
    expense: number;
    net: number;
    marginPct?: number;
  }[];
  isLoading?: boolean;
}

export function ProfitabilityChart({ data, isLoading = false }: ProfitabilityChartProps) {
  // Transform data to focus on net income and margin
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      month: item.month.charAt(0).toUpperCase() + item.month.slice(1, 3),
      net: item.net,
      marginPct: item.marginPct || (item.revenue ? (item.net / item.revenue) * 100 : 0)
    }));
  }, [data]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Profitability by Month</CardTitle>
        </CardHeader>
        <CardContent className="h-80 animate-pulse">
          <div className="h-full w-full bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  // Format values for tooltip
  const formatDollar = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="text-sm font-medium">{
            // Convert short month name back to full name
            data.find(item => item.month.toLowerCase().startsWith(label.toLowerCase()))?.month
          }</p>
          <p className="text-sm font-medium">
            Net Income: {formatDollar(payload[0].value)}
          </p>
          <p className="text-sm">
            Margin: {formatPercent(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Profitability by Month</CardTitle>
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
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            <Bar 
              yAxisId="left"
              dataKey="net" 
              name="Net Income" 
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.net >= 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
            <Bar 
              yAxisId="right"
              dataKey="marginPct" 
              name="Profit Margin" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}