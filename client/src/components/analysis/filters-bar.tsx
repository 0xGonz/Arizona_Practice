import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { formatDateRange, extractEntitiesFromMonthlyData } from '@/lib/data-utils';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { useAnalysisStore } from '@/store/analysis-store';
import { useToast } from '@/hooks/use-toast';

interface Entity {
  id: string;
  name: string;
}

interface FiltersBarProps {
  entityType: 'employee' | 'business';
}

export function FiltersBar({ entityType }: FiltersBarProps) {
  const { filters, setDateRange, clearFilters, selectEntity } = useAnalysisStore();
  const { toast } = useToast();
  const [entities, setEntities] = useState<Entity[]>([]);
  
  // Get the data for each month
  const { data: monthlyData } = useQuery({
    queryKey: ['/api/uploads'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch the monthly data files that we need for entity lists
  useEffect(() => {
    if (monthlyData && Array.isArray(monthlyData)) {
      // Find the most recent month with both E and O files
      const months: string[] = [];
      const monthMap = new Map<string, { e?: number; o?: number }>();
      
      monthlyData.forEach((upload: any) => {
        if (upload.type === 'monthly-e' || upload.type === 'monthly-o') {
          const month = upload.filename.split(' - ')[1]?.split('.')[0]?.toLowerCase();
          if (month) {
            if (!monthMap.has(month)) {
              monthMap.set(month, { e: undefined, o: undefined });
              months.push(month);
            }
            
            const monthData = monthMap.get(month);
            if (upload.type === 'monthly-e') {
              monthData!.e = upload.id;
            } else {
              monthData!.o = upload.id;
            }
          }
        }
      });
      
      // Choose the most recent month that has the type we need
      let latestMonth = '';
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        const monthData = monthMap.get(month);
        
        if (entityType === 'employee' && monthData?.e) {
          latestMonth = month;
          break;
        } else if (entityType === 'business' && monthData?.o) {
          latestMonth = month;
          break;
        }
      }
      
      if (latestMonth && monthMap.has(latestMonth)) {
        const uploadId = entityType === 'employee' 
          ? monthMap.get(latestMonth)?.e 
          : monthMap.get(latestMonth)?.o;
        
        if (uploadId) {
          // Fetch the upload data
          fetch(`/api/uploads/${uploadId}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.content) {
                try {
                  // Parse the content and extract entities
                  const content = JSON.parse(data.content);
                  const extractedEntities = extractEntitiesFromMonthlyData(
                    content, 
                    entityType === 'employee' ? 'e' : 'o'
                  );
                  
                  if (extractedEntities.length > 0) {
                    setEntities(extractedEntities);
                  } else {
                    console.warn(`No ${entityType} entities found in the data.`);
                    toast({
                      title: 'No entities found',
                      description: `Couldn't extract ${entityType} data from the files. Please upload proper E or O files.`,
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Error parsing monthly data:', error);
                }
              }
            })
            .catch(error => {
              console.error(`Error fetching ${entityType} data:`, error);
            });
        }
      } else {
        console.warn(`No ${entityType === 'employee' ? 'E' : 'O'}-type files found.`);
      }
    }
  }, [monthlyData, entityType, toast]);
  
  // Handle date range selection
  const handleDateRangeSelect = (range: DateRange) => {
    setDateRange(range);
  };
  
  // Handle entity selection
  const handleEntitySelect = (value: string) => {
    if (value === 'all') {
      // Clear the entity selection
      selectEntity('', entityType);
    } else {
      // Set the selected entity
      selectEntity(value, entityType);
    }
  };
  
  // Handle filter reset
  const handleResetFilters = () => {
    clearFilters();
  };
  
  // Get the currently selected entity value
  const currentSelection = entityType === 'employee' 
    ? filters.selectedEmployee 
    : filters.selectedBusiness;
  
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
                  {formatDateRange(filters.range)}
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
              value={currentSelection || 'all'} 
              onValueChange={handleEntitySelect}
              disabled={entities.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={`All ${entityType === 'employee' ? 'Employees' : 'Business Lines'}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All {entityType === 'employee' ? 'Employees' : 'Business Lines'}
                </SelectItem>
                {entities.map((entity) => (
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