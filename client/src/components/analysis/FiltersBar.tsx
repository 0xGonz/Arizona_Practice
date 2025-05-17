import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useAnalysisStore } from '../../store/analysis-store';
import { useEmployeeList } from '../../hooks/useEmployeeAnalysis';
import { useBusinessList } from '../../hooks/useBusinessAnalysis';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface FiltersBarProps {
  mode: 'employee' | 'business';
}

export function FiltersBar({ mode }: FiltersBarProps) {
  const { 
    period, 
    setPeriod, 
    selectedMonth, 
    setSelectedMonth,
    employeeId, 
    selectEmployee, 
    businessId, 
    selectBusiness,
    resetFilters
  } = useAnalysisStore();

  // Get entity lists based on the mode
  const { data: employees, isLoading: isLoadingEmployees } = useEmployeeList();
  const { data: businesses, isLoading: isLoadingBusinesses } = useBusinessList();

  // Reset filters when mode changes
  useEffect(() => {
    resetFilters();
  }, [mode, resetFilters]);

  // Entity selection
  const handleEntityChange = (value: string) => {
    if (mode === 'employee') {
      selectEmployee(value === 'all' ? null : value);
    } else {
      selectBusiness(value === 'all' ? null : value);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Period selection */}
          <div className="flex flex-col space-y-1 w-full md:w-48">
            <label className="text-sm font-medium">Period</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-year">Full Year</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month picker (shown only for monthly period) */}
          {period === 'monthly' && (
            <div className="flex flex-col space-y-1 w-full md:w-48">
              <label className="text-sm font-medium">Month</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth ? format(new Date(selectedMonth), 'MMMM yyyy') : 'Pick a month'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedMonth ? new Date(selectedMonth) : undefined}
                    onSelect={(date) => setSelectedMonth(date ? format(date, 'yyyy-MM-dd') : null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Entity selection dropdown */}
          <div className="flex flex-col space-y-1 w-full md:w-64">
            <label className="text-sm font-medium">{mode === 'employee' ? 'Employee' : 'Business Line'}</label>
            <Select 
              value={(mode === 'employee' ? employeeId : businessId) || 'all'} 
              onValueChange={handleEntityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${mode === 'employee' ? 'employee' : 'business line'}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{mode === 'employee' ? 'All Employees' : 'All Business Lines'}</SelectItem>
                
                {mode === 'employee' && employees && employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
                
                {mode === 'business' && businesses && businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset filters button */}
          <Button 
            variant="outline" 
            className="ml-auto mt-4 md:mt-0"
            onClick={resetFilters}
          >
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}