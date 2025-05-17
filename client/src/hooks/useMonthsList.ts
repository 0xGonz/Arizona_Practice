import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch list of available months that have data
 */
export function useMonthsList() {
  return useQuery({
    queryKey: ['available-months'],
    queryFn: () => 
      fetch('/api/analytics/months')
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch available months');
          }
          return res.json();
        }),
    staleTime: Infinity
  });
}