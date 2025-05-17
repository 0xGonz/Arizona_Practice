import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";

interface FinancialMetric {
  name: string;
  value: number;
  color: string;
}

interface FinancialBarChartProps {
  data: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
  title?: string;
}

export function FinancialBarChart({ data, title = "Key Financial Metrics" }: FinancialBarChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData: FinancialMetric[] = [
    {
      name: "Total Revenue",
      value: data.revenue,
      color: "#3b82f6" // blue
    },
    {
      name: "Total Expenses",
      value: data.expenses,
      color: "#ef4444" // red
    },
    {
      name: "Net Income",
      value: data.netIncome,
      color: "#22c55e" // green
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-medium">
          <FileBarChart className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => 
                `$${Math.abs(value) >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
              } 
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value as number)} 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Amount">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}