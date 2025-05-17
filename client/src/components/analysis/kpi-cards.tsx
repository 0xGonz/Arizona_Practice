import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface KpiCardsProps {
  data: {
    revenue: number;
    expense: number;
    net: number;
  };
  isLoading?: boolean;
}

export function KpiCards({ data, isLoading = false }: KpiCardsProps) {
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  // Calculate margin percentage
  const marginPct = data.revenue !== 0 
    ? (data.net / data.revenue) * 100 
    : 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Revenue Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-24 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-gray-100 animate-pulse rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <div className="p-1.5 rounded-full bg-blue-50">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.revenue)}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Expenses Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-24 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-gray-100 animate-pulse rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <div className="p-1.5 rounded-full bg-red-50">
                  <DollarSign className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(data.expense)}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Net Income Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-24 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-gray-100 animate-pulse rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Net Income</p>
                <div className={`p-1.5 rounded-full ${data.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  {data.net >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className={`text-2xl font-bold ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.net)}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Profit Margin Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-24 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-gray-100 animate-pulse rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                <div className={`p-1.5 rounded-full ${marginPct >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  {marginPct >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className={`text-2xl font-bold ${marginPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marginPct.toFixed(1)}%
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}