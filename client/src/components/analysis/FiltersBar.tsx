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
import { useMonthsList } from '../../hooks/useMonthsList';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface FiltersBarProps {
  mode: 'employee' | 'business';
}

export function FiltersBar({ mode }: FiltersBarProps) {
  const { 
    periodType, 
    setPeriodFullYear, 
    setPeriodMonth, 
    monthSelected, 
    employeeId, 
    selectEmployee, 
    businessId, 
    selectBusiness,
    resetFilters
  } = useAnalysisStore();

  // Get entity lists based on the mode
  const { data: employees, isLoading: isLoadingEmployees } = useEmployeeList();
  const { data: businesses, isLoading: isLoadingBusinesses } = useBusinessList();
  const { data: months } = useMonthsList();
  
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
            <Select
              value={periodType}
              onValueChange={(value) => value === 'FULL_YEAR' ? setPeriodFullYear() : undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_YEAR">Full Year</SelectItem>
                <SelectItem value="MONTH">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month picker (shown only for monthly period) */}
          {periodType === 'MONTH' && months && months.length > 0 && (
            <div className="flex flex-col space-y-1 w-full md:w-48">
              <label className="text-sm font-medium">Month</label>
              <Select 
                value={monthSelected || ''} 
                onValueChange={setPeriodMonth}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => {
                    // Convert date format: 2024-01-15 -> Jan 2024
                    const date = new Date(month);
                    const displayText = format(date, 'MMM yyyy');
                    // Convert to yyyy-MM format for the value
                    const monthValue = format(date, 'yyyy-MM');
                    
                    return (
                      <SelectItem key={month} value={monthValue}>
                        {displayText}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
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