import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ComparisonData } from "@/types";

interface AncillaryRoiCardProps {
  comparisonData: ComparisonData[];
  ancillaryMetrics: {
    revenue: number;
    expenses: number;
    profitMargin: number;
    roi: number;
  };
}

export default function AncillaryRoiCard({
  comparisonData,
  ancillaryMetrics
}: AncillaryRoiCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Ancillary vs Professional</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Download Data</DropdownMenuItem>
            <DropdownMenuItem>View Full Screen</DropdownMenuItem>
            <DropdownMenuItem>Print Chart</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000)}k`}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), '']}
              />
              <Legend />
              <Bar dataKey="professional" name="Professional" fill="#42A5F5" />
              <Bar dataKey="ancillary" name="Ancillary" fill="#66BB6A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <h4 className="font-medium text-sm text-neutral-text mt-2 mb-3">Ancillary ROI</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-neutral-text mb-1">Ancillary Revenue</p>
            <p className="text-lg font-semibold numeric text-primary">
              {formatCurrency(ancillaryMetrics.revenue)}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-neutral-text mb-1">Ancillary Expenses</p>
            <p className="text-lg font-semibold numeric text-primary">
              {formatCurrency(ancillaryMetrics.expenses)}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-neutral-text mb-1">Profit Margin</p>
            <p className="text-lg font-semibold numeric text-positive">
              {ancillaryMetrics.profitMargin}%
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-neutral-text mb-1">ROI</p>
            <p className="text-lg font-semibold numeric text-positive">
              {ancillaryMetrics.roi}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
