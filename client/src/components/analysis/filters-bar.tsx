import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useAnalysisStore } from '@/store/analysis-store';

interface FiltersBarProps {
  entityType: 'employee' | 'business';
}

export function FiltersBar({ entityType }: FiltersBarProps) {
  const { filters, setDateRange, setSelectedEmployee, setSelectedBusiness, resetFilters } = useAnalysisStore();
  const [date, setDate] = useState<DateRange | undefined>(filters.range);

  // Fetch employee or business list based on entityType
  const { data: entities, isLoading } = useQuery({
    queryKey: [`/api/analytics/${entityType}/list`],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });

  // Handle date range selection
  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    setDate(selectedRange);
    if (selectedRange?.from) {
      setDateRange(selectedRange);
    }
  };

  // Handle entity selection
  const handleEntitySelect = (entityId: string) => {
    if (entityType === 'employee') {
      setSelectedEmployee(entityId === 'all' ? null : entityId);
    } else {
      setSelectedBusiness(entityId === 'all' ? null : entityId);
    }
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    return date ? format(date, 'LLL dd, y') : '';
  };

  return (
    <Card className="bg-white mb-6">
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <span className="text-sm font-medium">Filter by date:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal md:w-[300px]",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {formatDate(date.from)} - {formatDate(date.to)}
                    </>
                  ) : (
                    formatDate(date.from)
                  )
                ) : (
                  "Select date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <span className="text-sm font-medium">
            {entityType === 'employee' ? 'Select employee:' : 'Select business line:'}
          </span>
          <Select 
            onValueChange={handleEntitySelect} 
            value={entityType === 'employee' ? filters.selectedEmployee || 'all' : filters.selectedBusiness || 'all'}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder={entityType === 'employee' ? "Select employee" : "Select business line"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {entityType === 'employee' ? 'Employees' : 'Business Lines'}</SelectItem>
              {!isLoading && entities?.map((entity: any) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          onClick={resetFilters}
          className="w-full md:w-auto"
        >
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}