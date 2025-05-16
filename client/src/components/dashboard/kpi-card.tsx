import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: number;
  change?: number;
  icon: string; // Material icon name
}

export default function KPICard({ title, value, change = 0, icon }: KPICardProps) {
  const isPositive = change >= 0;
  const isNegative = change < 0;
  const absChange = Math.abs(change);
  
  // Format value as currency
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-neutral-text font-medium">{title}</h3>
          <span className="material-icons text-primary">{icon}</span>
        </div>
        
        <div className="flex items-baseline">
          <p className="text-2xl font-bold numeric">{formattedValue}</p>
          
          {change !== 0 && (
            <span className={`ml-2 flex items-center text-sm ${isPositive ? 'text-positive' : 'text-negative'}`}>
              {isPositive ? (
                <ArrowUpIcon className="h-4 w-4 mr-0.5" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-0.5" />
              )}
              {absChange}%
            </span>
          )}
        </div>
        
        <p className="text-neutral-text text-sm mt-1">vs previous year</p>
      </CardContent>
    </Card>
  );
}
