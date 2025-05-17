import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/queryClient';

/**
 * Hook to fetch list of available months that have data
 */
export function useMonthsList() {
  return useQuery({
    queryKey: ['available-months'],
    queryFn: () => api.get('/api/analytics/months'),
    staleTime: Infinity
  });
}