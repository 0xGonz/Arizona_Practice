import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/queryClient';
import { AnalyticsRange } from './useEmployeeAnalysis';

// Half day in milliseconds for stale time
const HALF_DAY = 12 * 60 * 60 * 1000;

export interface BusinessAnalyticsData {
  month: string;
  revenue: number;
  expense: number;
  net: number;
  marginPct?: number;
}

export interface BusinessListItem {
  id: string;
  name: string;
}

/**
 * Hook to fetch summary data for all business lines
 */
export function useBusinessSummary(range: AnalyticsRange) {
  return useQuery({ 
    queryKey: ['biz-summary', range],
    queryFn: () => api.get('/api/analytics/business/summary', { params: range }),
    staleTime: HALF_DAY
  });
}

/**
 * Hook to fetch detailed data for a specific business line
 */
export function useBusinessDetail(id: string | null, range: AnalyticsRange) {
  return useQuery({ 
    queryKey: ['biz-detail', id, range],
    queryFn: () => api.get('/api/analytics/business/detail', { params: { businessId: id, ...range } }),
    enabled: !!id,
    staleTime: HALF_DAY
  });
}

/**
 * Hook to fetch list of business lines for dropdown
 */
export function useBusinessList() {
  return useQuery({ 
    queryKey: ['business-list'],
    queryFn: () => api.get('/api/analytics/business/list'),
    staleTime: HALF_DAY
  });
}