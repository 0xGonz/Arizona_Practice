import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Interface for an all-entities view (horizontal bar chart showing total net for each entity)
interface EntityNetData {
  id: string;
  name: string;
  net: number;
}

// Interface for single entity trend data (margin % trend line chart)
interface MarginTrendData {
  month: string;
  marginPct: number;
}

interface ProfitabilityChartProps {
  data: EntityNetData[] | MarginTrendData[];
  singleEntitySelected: boolean;
  entityType: 'employee' | 'business';
  isLoading?: boolean;
}

export function ProfitabilityChart({
  data,
  singleEntitySelected,
  entityType,
  isLoading = false
}: ProfitabilityChartProps) {
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  // Format percentage for tooltip
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Sort data for horizontal bar chart
  const sortedData = singleEntitySelected 
    ? data 
    : [...(data as EntityNetData[])].sort((a, b) => b.net - a.net);

  // Determine chart title based on mode and entity type
  const chartTitle = singleEntitySelected
    ? `Profit Margin Trend`
    : `${entityType === 'employee' ? 'Employee' : 'Business Line'} Net Contribution`;
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{chartTitle}</CardTitle>
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
              {singleEntitySelected ? (
                // Line chart for margin trend when a single entity is selected
                <LineChart 
                  data={data as MarginTrendData[]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`}
                    domain={['auto', 'auto']} 
                  />
                  <Tooltip 
                    formatter={(value) => [formatPercentage(value as number), 'Margin']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="marginPct" 
                    name="Profit Margin" 
                    stroke="#10b981" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              ) : (
                // Horizontal bar chart for entity contributions
                <BarChart 
                  data={sortedData.slice(0, 10)} // Show top 10 entities
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 90, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? 
                      `${(value / 1000).toFixed(0)}K` : value}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Net Income']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="net" 
                    name="Net Contribution" 
                    // Color bars based on positive/negative values
                    fill={(entry) => (entry.net >= 0 ? '#10b981' : '#ef4444')}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}