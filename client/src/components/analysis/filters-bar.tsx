import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { months, formatMonthName, extractEntitiesFromMonthlyData } from '@/lib/data-utils';
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
  const { filters, setSelectedMonth, clearFilters, selectEntity } = useAnalysisStore();
  const { toast } = useToast();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  
  // Get the data for all uploads
  const { data: monthlyData } = useQuery({
    queryKey: ['/api/uploads'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Extract available months and map upload IDs
  useEffect(() => {
    if (monthlyData && Array.isArray(monthlyData)) {
      const monthMap = new Map<string, { e?: number; o?: number }>();
      
      monthlyData.forEach((upload: any) => {
        if (upload.type === 'monthly-e' || upload.type === 'monthly-o') {
          const month = upload.filename.split(' - ')[1]?.split('.')[0]?.toLowerCase();
          if (month) {
            if (!monthMap.has(month)) {
              monthMap.set(month, { e: undefined, o: undefined });
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
      
      // Get valid months with uploads of the correct type
      const validMonths = Array.from(monthMap.entries())
        .filter(([_, data]) => {
          return entityType === 'employee' ? data.e !== undefined : data.o !== undefined;
        })
        .map(([month]) => month);
      
      // Sort months in chronological order
      const sortedMonths = validMonths.sort((a, b) => {
        return months.indexOf(a) - months.indexOf(b);
      });
      
      setAvailableMonths(sortedMonths);
      
      // Set most recent month as default if no month is selected
      if (sortedMonths.length > 0 && !filters.selectedMonth) {
        setSelectedMonth(sortedMonths[0]);
      }
      
      // Load entity data for the selected month
      const selectedMonth = filters.selectedMonth || (sortedMonths.length > 0 ? sortedMonths[0] : '');
      if (selectedMonth && monthMap.has(selectedMonth)) {
        const uploadId = entityType === 'employee' 
          ? monthMap.get(selectedMonth)?.e 
          : monthMap.get(selectedMonth)?.o;
        
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
        console.warn(`No ${entityType === 'employee' ? 'E' : 'O'}-type files found for ${selectedMonth}`);
      }
    }
  }, [monthlyData, entityType, filters.selectedMonth, setSelectedMonth, toast]);
  
  // Handle month selection
  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
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
          {/* Month Filter */}
          <div className="flex-1 min-w-[200px]">
            <Label className="mb-2 block text-sm">Month</Label>
            <Select 
              value={filters.selectedMonth || (availableMonths.length > 0 ? availableMonths[0] : '')} 
              onValueChange={handleMonthSelect}
              disabled={availableMonths.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonthName(month)} 2024
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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