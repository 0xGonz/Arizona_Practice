import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { PerformerData } from "@/types";

interface PerformersCardProps {
  title: string;
  performers: PerformerData[];
  positiveValues: boolean;
}

export default function PerformersCard({
  title,
  performers,
  positiveValues
}: PerformersCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Download Data</DropdownMenuItem>
            <DropdownMenuItem>View All</DropdownMenuItem>
            <DropdownMenuItem>Export as CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {performers.map((performer, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full ${positiveValues ? 'bg-primary-light' : 'bg-neutral-text'} text-white flex items-center justify-center mr-3`}>
                <span>{performer.initials}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{performer.name}</span>
                  <span className={`numeric font-medium ${positiveValues ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(performer.value)}
                  </span>
                </div>
                <div className="w-full bg-neutral-bg rounded-full h-1.5 mt-1.5">
                  <div 
                    className={`${positiveValues ? 'bg-positive' : 'bg-negative'} h-1.5 rounded-full`} 
                    style={{ width: `${performer.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary text-sm font-medium">
            View All {positiveValues ? 'Providers' : 'Units'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
