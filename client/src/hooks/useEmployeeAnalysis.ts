import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

// Half day in milliseconds for stale time
const HALF_DAY = 12 * 60 * 60 * 1000;

export interface AnalyticsRange {
  from: string;
  to: string;
}

export interface EmployeeAnalyticsData {
  month: string;
  revenue: number;
  expense: number;
  net: number;
  marginPct?: number;
}

export interface EmployeeListItem {
  id: string;
  name: string;
}

/**
 * Hook to fetch summary data for all employees
 */
export function useEmployeeSummary(range: AnalyticsRange) {
  return useQuery({ 
    queryKey: ['emp-summary', range],
    queryFn: () => apiRequest<EmployeeAnalyticsData[]>({
      method: 'GET',
      url: '/api/analytics/employee/summary',
      params: range
    }),
    staleTime: HALF_DAY
  });
}

/**
 * Hook to fetch detailed data for a specific employee
 */
export function useEmployeeDetail(id: string | null, range: AnalyticsRange) {
  return useQuery({ 
    queryKey: ['emp-detail', id, range],
    queryFn: () => apiRequest<EmployeeAnalyticsData[]>({
      method: 'GET',
      url: '/api/analytics/employee/detail',
      params: { employeeId: id, ...range }
    }),
    enabled: !!id,
    staleTime: HALF_DAY
  });
}

/**
 * Hook to fetch list of employees for dropdown
 */
export function useEmployeeList() {
  return useQuery({ 
    queryKey: ['employee-list'],
    queryFn: () => apiRequest<EmployeeListItem[]>({
      method: 'GET',
      url: '/api/analytics/employee/list'
    }),
    staleTime: HALF_DAY
  });
}