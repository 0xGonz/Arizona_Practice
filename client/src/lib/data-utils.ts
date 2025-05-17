import { addMonths, startOfYear, endOfYear, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

/**
 * Get a date range for the current year
 */
export function getCurrentYearDateRange(): DateRange {
  const now = new Date();
  return {
    from: startOfYear(now),
    to: endOfYear(now)
  };
}

/**
 * Get a date range for the past 12 months
 */
export function getPast12MonthsDateRange(): DateRange {
  const now = new Date();
  return {
    from: addMonths(now, -12),
    to: now
  };
}

/**
 * Format a date range as a string
 */
export function formatDateRange(range: DateRange): string {
  if (range.from && range.to) {
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  }
  if (range.from) {
    return `${format(range.from, 'MMM d, yyyy')} - Present`;
  }
  return 'All Time';
}

/**
 * Extract entity names from monthly data
 * This can work with both E and O files
 */
export function extractEntitiesFromMonthlyData(monthlyData: any, type: 'e' | 'o') {
  if (!monthlyData) return [];
  
  try {
    // For employee files, extract from the entityValues keys
    if (type === 'e' && monthlyData.e && monthlyData.e.lineItems && monthlyData.e.lineItems.length > 0) {
      const firstLineItem = monthlyData.e.lineItems[0];
      if (firstLineItem && firstLineItem.entityValues) {
        return Object.keys(firstLineItem.entityValues).map(name => ({
          id: name,
          name: name
        }));
      }
    }
    
    // For business files, extract from the entityValues keys
    if (type === 'o' && monthlyData.o && monthlyData.o.lineItems && monthlyData.o.lineItems.length > 0) {
      const firstLineItem = monthlyData.o.lineItems[0];
      if (firstLineItem && firstLineItem.entityValues) {
        return Object.keys(firstLineItem.entityValues).map(name => ({
          id: name,
          name: name
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error extracting entities:", error);
    return [];
  }
}