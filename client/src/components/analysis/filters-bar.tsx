import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { useAnalysisStore } from '@/store/analysis-store';

interface FiltersBarProps {
  entityType: 'employee' | 'business';
}

export function FiltersBar({ entityType }: FiltersBarProps) {
  const { filters, setDateRange, clearFilters, selectEntity } = useAnalysisStore();
  
  // Fetch entity list (employee or business)
  const { data: entityList, isLoading: isEntityLoading } = useQuery({
    queryKey: [`/api/analytics/${entityType}/list`],
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
  
  // Handle date range selection
  const handleDateRangeSelect = (range: DateRange) => {
    setDateRange(range);
  };
  
  // Handle entity selection
  const handleEntitySelect = (value: string) => {
    if (value === 'all') {
      // Clear the entity selection
      selectEntity('');
    } else {
      // Set the selected entity
      selectEntity(value);
    }
  };
  
  // Handle filter reset
  const handleResetFilters = () => {
    clearFilters();
  };
  
  // Format date range for display
  const dateRangeText = React.useMemo(() => {
    if (filters.range.from && filters.range.to) {
      return `${format(filters.range.from, 'MMM d, yyyy')} - ${format(filters.range.to, 'MMM d, yyyy')}`;
    }
    if (filters.range.from) {
      return `${format(filters.range.from, 'MMM d, yyyy')} - Present`;
    }
    return 'All Time';
  }, [filters.range]);
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Range Filter */}
          <div className="flex-1 min-w-[200px]">
            <Label className="mb-2 block text-sm">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRangeText}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.range.from}
                  selected={filters.range}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Entity Selection Filter */}
          <div className="flex-1 min-w-[200px]">
            <Label className="mb-2 block text-sm">
              {entityType === 'employee' ? 'Employee' : 'Business Line'}
            </Label>
            <Select 
              value={entityType === 'employee' ? filters.selectedEmployee : filters.selectedBusiness} 
              onValueChange={handleEntitySelect}
              disabled={isEntityLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={`All ${entityType === 'employee' ? 'Employees' : 'Business Lines'}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All {entityType === 'employee' ? 'Employees' : 'Business Lines'}
                </SelectItem>
                {Array.isArray(entityList) && entityList.map((entity: any) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Reset Button */}
          <div>
            <Button 
              variant="ghost" 
              onClick={handleResetFilters}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}