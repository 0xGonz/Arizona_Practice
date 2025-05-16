/**
 * Utilities for building and manipulating hierarchical data structures
 * This is used for properly displaying nested line items in CSV data
 */

/**
 * Builds a hierarchical tree structure from flat line items with depth information
 */
export function buildHierarchy(lineItems: any[]) {
  if (!lineItems || lineItems.length === 0) return [];
  
  // Create a deep copy to avoid mutating the original array
  const itemsCopy = JSON.parse(JSON.stringify(lineItems));
  
  // Root array to hold the top-level items
  const root: any[] = [];
  
  // Stack to keep track of the current parent at each depth level
  const stack: any[] = [];
  
  // Process each line item to build the hierarchy
  itemsCopy.forEach(item => {
    // Pop items from the stack until we find the right parent
    while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      // This is a top-level item
      root.push(item);
    } else {
      // Add current item as a child of the current parent
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(item);
    }
    
    // Add current item to the stack as potential parent
    stack.push(item);
  });
  
  return root;
}

/**
 * Extracts specific values from line items using keyword matching
 * Useful for finding totals, revenue, expenses, etc. in financial data
 */
export function extractValueByKeyword(lineItems: any[], keyword: string): number {
  const item = lineItems.find(item => 
    item.name.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return item?.summaryValue || 0;
}

/**
 * Calculates financial metrics from line items
 */
export function calculateFinancialMetrics(lineItems: any[]) {
  const revenue = extractValueByKeyword(lineItems, 'total revenue');
  const expenses = extractValueByKeyword(lineItems, 'total operating expenses');
  const netIncome = extractValueByKeyword(lineItems, 'net income') || (revenue - expenses);
  
  return {
    revenue,
    expenses,
    netIncome
  };
}