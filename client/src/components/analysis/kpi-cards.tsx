import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number;
  change?: number;
  prefix?: string;
  isLoading?: boolean;
}

function KpiCard({ title, value, change, prefix = '$', isLoading = false }: KpiCardProps) {
  // Format currency value
  const formattedValue = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="h-8 w-28 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <h3 className="text-2xl font-bold mt-1">{formattedValue}</h3>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        {change !== undefined && (
          <div className="mt-4 flex items-center">
            {change > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs. prev. period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface KpiCardsProps {
  data: {
    revenue: number;
    expense: number;
    net: number;
  };
  isLoading?: boolean;
}

export function KpiCards({ data, isLoading = false }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <KpiCard 
        title="Total Revenue" 
        value={data.revenue} 
        isLoading={isLoading} 
      />
      <KpiCard 
        title="Total Expenses" 
        value={data.expense} 
        isLoading={isLoading} 
      />
      <KpiCard 
        title="Net Income" 
        value={data.net} 
        isLoading={isLoading} 
      />
    </div>
  );
}