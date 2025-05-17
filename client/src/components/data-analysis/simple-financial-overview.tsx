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
    const entities = data.entityColumns.filter((col: string) => 
      col !== 'Line Item' && 
      !col.toLowerCase().includes('total') && 
      !col.toLowerCase().includes('summary')
    );
    
    // Find revenue, expenses, and net income values for the first entity
    const firstEntity = entities[0];
    
    // Find total revenue
    const revenueItem = data.lineItems.find((item: any) => 
      item.name === "Total Revenue" || 
      item.name === "Collections" || 
      item.name === "Total Income"
    );
    
    // Find total expenses
    const expensesItem = data.lineItems.find((item: any) => 
      item.name === "Total Operating Expenses" || 
      item.name === "Total Expenses"
    );
    
    // Find net income
    const netIncomeItem = data.lineItems.find((item: any) => 
      item.name === "Net Income (Loss)" || 
      item.name === "Net Income"
    );
    
    // Find payroll expense
    const payrollItem = data.lineItems.find((item: any) => 
      item.name === "Total Payroll and Related Expense" || 
      item.name === "Payroll Expense" || 
      item.name.includes("Payroll")
    );
    
    // Get values for the first entity for the bar chart
    const revenue = revenueItem?.entityValues?.[firstEntity] || 0;
    const expenses = expensesItem?.entityValues?.[firstEntity] || 0;
    const netIncome = netIncomeItem?.entityValues?.[firstEntity] || 0;
    
    // Prepare table data for all entities
    const tableData = entities.map((entity: string) => ({
      name: entity,
      revenue: revenueItem?.entityValues?.[entity] || 0,
      expenses: expensesItem?.entityValues?.[entity] || 0,
      netIncome: netIncomeItem?.entityValues?.[entity] || 0,
      payroll: payrollItem?.entityValues?.[entity] || 0
    }));
    
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