import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart,
  Percent
} from 'lucide-react';

interface KPICardProps {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  isLoading?: boolean;
}

export function KPICards({ revenue, expenses, profit, margin, isLoading = false }: KPICardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-1"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format percentage values
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };
  
  // Determine profit trend icon
  const renderTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    } else if (value < 0) {
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    }
    return null;
  };
  
  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(revenue),
      icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
      className: 'border-l-4 border-emerald-500'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(expenses),
      icon: <BarChart3 className="w-5 h-5 text-amber-500" />,
      className: 'border-l-4 border-amber-500'
    },
    {
      title: 'Net Income',
      value: formatCurrency(profit),
      icon: renderTrendIcon(profit),
      className: `border-l-4 ${profit >= 0 ? 'border-emerald-500' : 'border-red-500'}`
    },
    {
      title: 'Profit Margin',
      value: formatPercent(margin),
      icon: <Percent className="w-5 h-5 text-blue-500" />,
      className: `border-l-4 ${margin >= 0 ? 'border-blue-500' : 'border-red-500'}`
    }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className={card.className}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-neutral-dark">{card.title}</h3>
              {card.icon}
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}