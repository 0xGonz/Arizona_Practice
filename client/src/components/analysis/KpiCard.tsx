import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

// Helper function to format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface KpiCardProps {
  title: string;
  value: number;
  previousValue?: number;
  colorScheme?: 'blue' | 'green' | 'red' | 'gray'; 
}

export function KpiCard({ 
  title, 
  value, 
  previousValue, 
  colorScheme = 'blue' 
}: KpiCardProps) {
  // Calculate percentage change
  const percentChange = previousValue 
    ? ((value - previousValue) / Math.abs(previousValue)) * 100 
    : 0;
  
  // Determine if trending up or down
  const isPositive = percentChange > 0;
  
  // Determine if the positive trend is good (revenue) or bad (expenses)
  const isGoodTrend = (title.toLowerCase().includes('revenue') && isPositive) || 
                      (title.toLowerCase().includes('expense') && !isPositive) ||
                      (title.toLowerCase().includes('income') && isPositive) ||
                      (title.toLowerCase().includes('profit') && isPositive);
  
  // Get color scheme based on trend and metric type
  const getBgColor = () => {
    switch (colorScheme) {
      case 'blue': return 'bg-blue-50';
      case 'green': return 'bg-green-50';
      case 'red': return 'bg-red-50';
      case 'gray': return 'bg-gray-50';
    }
  };
  
  const getTextColor = () => {
    switch (colorScheme) {
      case 'blue': return 'text-blue-700';
      case 'green': return 'text-green-700';
      case 'red': return 'text-red-700';
      case 'gray': return 'text-gray-700';
    }
  };

  return (
    <Card className={`${getBgColor()} border-none shadow-sm`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1 tracking-tight">
          {formatCurrency(value)}
        </div>
        
        {previousValue !== undefined && (
          <div className="flex items-center text-xs">
            {isPositive ? (
              <ArrowUpIcon className={`h-3 w-3 mr-1 ${isGoodTrend ? 'text-green-600' : 'text-red-600'}`} />
            ) : (
              <ArrowDownIcon className={`h-3 w-3 mr-1 ${isGoodTrend ? 'text-green-600' : 'text-red-600'}`} />
            )}
            <span className={`${isGoodTrend ? 'text-green-600' : 'text-red-600'} font-medium`}>
              {Math.abs(percentChange).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-1">vs prev. period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}