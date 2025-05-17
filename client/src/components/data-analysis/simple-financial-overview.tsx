import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialBarChart } from "./financial-bar-chart";
import { FinancialDetailsTable } from "./financial-details-table";

interface SimpleFinancialOverviewProps {
  monthlyData: any;
  selectedMonth: string;
}

export function SimpleFinancialOverview({ monthlyData, selectedMonth }: SimpleFinancialOverviewProps) {
  const [dataType, setDataType] = useState<"e" | "o">("e");
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Extract financial metrics from monthlyData
  const financialData = useMemo(() => {
    if (!monthlyData || !selectedMonth || selectedMonth === "all") {
      return {
        barChartData: { revenue: 0, expenses: 0, netIncome: 0 },
        tableData: []
      };
    }
    
    const monthData = monthlyData[selectedMonth];
    if (!monthData) {
      return {
        barChartData: { revenue: 0, expenses: 0, netIncome: 0 },
        tableData: []
      };
    }
    
    const data = dataType === "e" ? monthData.e : monthData.o;
    if (!data || !data.lineItems || !data.entityColumns) {
      return {
        barChartData: { revenue: 0, expenses: 0, netIncome: 0 },
        tableData: []
      };
    }
    
    // Get entity names (employees or departments)
    // This handles both old and new data structure
    let entities: string[] = [];
    if (data.entityColumns) {
      entities = data.entityColumns.filter((col: string) => 
        col !== 'Line Item' && 
        !col.toLowerCase().includes('total') && 
        !col.toLowerCase().includes('summary')
      );
    } else if (data.lineItems && data.lineItems[0] && data.lineItems[0].entityValues) {
      // Get entities from the first line item's entityValues object keys
      entities = Object.keys(data.lineItems[0].entityValues).filter(col => 
        col !== 'Line Item' && 
        !col.toLowerCase().includes('total') && 
        !col.toLowerCase().includes('summary')
      );
    }
    
    if (entities.length === 0) {
      console.log("No entities found in the data for", selectedMonth, dataType);
      return {
        barChartData: { revenue: 0, expenses: 0, netIncome: 0 },
        tableData: []
      };
    }
    
    // Find the first entity for the bar chart
    const firstEntity = entities[0];
    
    // Find the key line items
    // Find total revenue - try different common names
    const revenueItem = data.lineItems.find((item: any) => 
      item.name === "Total Revenue" || 
      item.name === "Collections" || 
      item.name === "Total Income" ||
      item.name.includes("40000 - Professional Fees")
    );
    
    // Find total expenses
    const expensesItem = data.lineItems.find((item: any) => 
      item.name === "Total Operating Expenses" || 
      item.name === "Total Expenses" ||
      item.name.includes("Total Expenses") ||
      item.name.includes("60000")
    );
    
    // Find net income
    const netIncomeItem = data.lineItems.find((item: any) => 
      item.name === "Net Income (Loss)" || 
      item.name === "Net Income" ||
      item.name.includes("Net Income") ||
      item.name.includes("Net Profit")
    );
    
    // Find payroll expense
    const payrollItem = data.lineItems.find((item: any) => 
      item.name === "Total Payroll and Related Expense" || 
      item.name === "Payroll Expense" || 
      item.name.includes("Payroll") ||
      item.name.includes("Salary")
    );
    
    // Get values for the first entity for the bar chart
    // Safely handle different data structures
    let revenue = 0;
    let expenses = 0;
    let netIncome = 0;
    
    if (revenueItem) {
      if (revenueItem.entityValues && revenueItem.entityValues[firstEntity] !== undefined) {
        revenue = revenueItem.entityValues[firstEntity];
      } else if (typeof revenueItem[firstEntity] === 'number') {
        revenue = revenueItem[firstEntity];
      }
    }
    
    if (expensesItem) {
      if (expensesItem.entityValues && expensesItem.entityValues[firstEntity] !== undefined) {
        expenses = expensesItem.entityValues[firstEntity];
      } else if (typeof expensesItem[firstEntity] === 'number') {
        expenses = expensesItem[firstEntity];
      }
    }
    
    if (netIncomeItem) {
      if (netIncomeItem.entityValues && netIncomeItem.entityValues[firstEntity] !== undefined) {
        netIncome = netIncomeItem.entityValues[firstEntity];
      } else if (typeof netIncomeItem[firstEntity] === 'number') {
        netIncome = netIncomeItem[firstEntity];
      }
    }
    
    // If we can't find a net income value, calculate it
    if (netIncome === 0 && (revenue !== 0 || expenses !== 0)) {
      netIncome = revenue - expenses;
    }
    
    // Prepare table data for all entities
    const tableData = entities.map((entity: string) => {
      // Safely handle different data structures for each entity
      let entityRevenue = 0;
      let entityExpenses = 0;
      let entityNetIncome = 0;
      let entityPayroll = 0;
      
      // Get revenue
      if (revenueItem) {
        if (revenueItem.entityValues && revenueItem.entityValues[entity] !== undefined) {
          entityRevenue = revenueItem.entityValues[entity];
        } else if (typeof revenueItem[entity] === 'number') {
          entityRevenue = revenueItem[entity];
        }
      }
      
      // Get expenses
      if (expensesItem) {
        if (expensesItem.entityValues && expensesItem.entityValues[entity] !== undefined) {
          entityExpenses = expensesItem.entityValues[entity];
        } else if (typeof expensesItem[entity] === 'number') {
          entityExpenses = expensesItem[entity];
        }
      }
      
      // Get net income
      if (netIncomeItem) {
        if (netIncomeItem.entityValues && netIncomeItem.entityValues[entity] !== undefined) {
          entityNetIncome = netIncomeItem.entityValues[entity];
        } else if (typeof netIncomeItem[entity] === 'number') {
          entityNetIncome = netIncomeItem[entity];
        }
      }
      
      // Get payroll
      if (payrollItem) {
        if (payrollItem.entityValues && payrollItem.entityValues[entity] !== undefined) {
          entityPayroll = payrollItem.entityValues[entity];
        } else if (typeof payrollItem[entity] === 'number') {
          entityPayroll = payrollItem[entity];
        }
      }
      
      // Calculate net income if it's zero but we have revenue or expenses
      if (entityNetIncome === 0 && (entityRevenue !== 0 || entityExpenses !== 0)) {
        entityNetIncome = entityRevenue - entityExpenses;
      }
      
      return {
        name: entity,
        revenue: entityRevenue,
        expenses: entityExpenses,
        netIncome: entityNetIncome,
        payroll: entityPayroll
      };
    });
    
    return {
      barChartData: { revenue, expenses, netIncome },
      tableData
    };
  }, [monthlyData, selectedMonth, dataType]);
  
  if (selectedMonth === "all") {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-center">
            <div>
              <h3 className="text-xl font-medium mb-2">Select a Month</h3>
              <p className="text-muted-foreground">
                Please select a specific month to view financial metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Financial Overview: {selectedMonth}</h2>
        <Select 
          value={dataType} 
          onValueChange={(value) => setDataType(value as "e" | "o")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Data Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="e">Employee (E) Data</SelectItem>
            <SelectItem value="o">Business (O) Data</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Bar Chart Card */}
      <FinancialBarChart 
        data={financialData.barChartData} 
        title={`${dataType === "e" ? "Employee" : "Business"} Financial Metrics`}
      />
      
      {/* Details Table Card */}
      <FinancialDetailsTable
        type={dataType === "e" ? "employee" : "business"}
        data={financialData.tableData}
      />
    </div>
  );
}