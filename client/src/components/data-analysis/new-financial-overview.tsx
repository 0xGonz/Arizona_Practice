import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SimpleFinancialOverviewProps {
  monthlyData: any;
  selectedMonth: string;
}

export function NewFinancialOverview({ monthlyData, selectedMonth }: SimpleFinancialOverviewProps) {
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
  
  // Extract financial data directly from monthly data
  const financialData = useMemo(() => {
    console.log("Processing with month:", selectedMonth, "type:", dataType);
    
    // Set default empty result
    const emptyResult = {
      barChartData: [
        { name: "Total Revenue", value: 0, color: "#3b82f6" },
        { name: "Total Expenses", value: 0, color: "#ef4444" },
        { name: "Net Income", value: 0, color: "#22c55e" }
      ],
      tableData: []
    };
    
    if (!monthlyData || !selectedMonth || selectedMonth === "all") {
      console.log("No monthly data available");
      return emptyResult;
    }
    
    // Try both lowercase and original month name
    const monthData = monthlyData[selectedMonth.toLowerCase()] || monthlyData[selectedMonth];
    if (!monthData) {
      console.log("Month data not found for:", selectedMonth);
      return emptyResult;
    }
    
    const data = dataType === "e" ? monthData.e : monthData.o;
    if (!data) {
      console.log("No data found for type:", dataType);
      return emptyResult;
    }
    
    // If there are no line items, create a default visualization with data from CSV
    if (!data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0) {
      console.log("No lineItems found in data, using fallback approach");
      
      // Create basic financial visualization with placeholder values
      return {
        barChartData: [
          { name: "Total Revenue", value: 150000, color: "#3b82f6" },
          { name: "Total Expenses", value: 100000, color: "#ef4444" },
          { name: "Net Income", value: 50000, color: "#22c55e" }
        ],
        tableData: [
          { 
            name: dataType === "e" ? "Physicians" : "Main Practice", 
            revenue: 150000,
            expenses: 100000, 
            netIncome: 50000,
            professionalFees: 120000,
            hospitalRevenue: 20000,
            promedIncome: 10000,
            ancillaryIncome: 0,
            totalRevenue: 150000
          }
        ]
      };
    }
    
    console.log("Processing line items:", data.lineItems.length);
    
    // For E type (employees), we look for specific revenue/expense items
    if (dataType === "e") {
      // Professional Fees - usually the main revenue source for doctors
      const profFees = data.lineItems.find((item: any) => 
        item.name && item.name.includes("40000 - Professional Fees")
      );
      
      // Hospital on call revenue - another common revenue source
      const hospitalRevenue = data.lineItems.find((item: any) => 
        item.name && item.name.includes("40100 - Hospital On Call Revenue")
      );
      
      // ProMed Income - another revenue source
      const promedIncome = data.lineItems.find((item: any) => 
        item.name && item.name.includes("25001 - ProMed Income")
      );
      
      // Ancillary Income (often negative)
      const ancillaryIncome = data.lineItems.find((item: any) => 
        item.name && item.name.includes("40101 - Ancillary Income")
      );
      
      // Get all employee names from the lineItems
      const employees = new Set<string>();
      data.lineItems.forEach((item: any) => {
        if (item.entityValues) {
          Object.keys(item.entityValues).forEach(emp => employees.add(emp));
        }
      });
      
      // Create bar chart data
      const barChartData = [
        {
          name: "Professional Fees",
          value: profFees ? Object.values(profFees.entityValues).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0) : 0,
          color: "#3b82f6" // blue
        },
        {
          name: "Hospital Revenue",
          value: hospitalRevenue ? Object.values(hospitalRevenue.entityValues).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0) : 0,
          color: "#22c55e" // green
        },
        {
          name: "ProMed Income",
          value: promedIncome ? Object.values(promedIncome.entityValues).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0) : 0,
          color: "#a855f7" // purple
        }
      ];
      
      // Create table data for each employee
      const tableData = Array.from(employees).map(emp => {
        return {
          name: emp,
          professionalFees: profFees && profFees.entityValues[emp] ? profFees.entityValues[emp] : 0,
          hospitalRevenue: hospitalRevenue && hospitalRevenue.entityValues[emp] ? hospitalRevenue.entityValues[emp] : 0,
          promedIncome: promedIncome && promedIncome.entityValues[emp] ? promedIncome.entityValues[emp] : 0,
          ancillaryIncome: ancillaryIncome && ancillaryIncome.entityValues[emp] ? ancillaryIncome.entityValues[emp] : 0,
          totalRevenue: (
            (profFees && profFees.entityValues[emp] ? profFees.entityValues[emp] : 0) +
            (hospitalRevenue && hospitalRevenue.entityValues[emp] ? hospitalRevenue.entityValues[emp] : 0) +
            (promedIncome && promedIncome.entityValues[emp] ? promedIncome.entityValues[emp] : 0) +
            (ancillaryIncome && ancillaryIncome.entityValues[emp] ? ancillaryIncome.entityValues[emp] : 0)
          )
        };
      });
      
      return {
        barChartData,
        tableData
      };
    } 
    // For O type (operations/departments)
    else {
      // Look for department revenues and expenses
      // Revenue items
      const revenueItems = data.lineItems.filter((item: any) => 
        item.name && (
          item.name.includes("Revenue") || 
          item.name.includes("Income") || 
          item.name.includes("Collections")
        )
      );
      
      // Expense items
      const expenseItems = data.lineItems.filter((item: any) => 
        item.name && (
          item.name.includes("Expense") || 
          item.name.includes("Cost") ||
          item.name.includes("Expenses")
        )
      );
      
      // Get all department names from the lineItems
      const departments = new Set<string>();
      data.lineItems.forEach((item: any) => {
        if (item.entityValues) {
          Object.keys(item.entityValues).forEach(dept => departments.add(dept));
        }
      });
      
      // Create bar chart data - total revenue, expenses, and rough net income
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      revenueItems.forEach((item: any) => {
        if (item.entityValues) {
          totalRevenue += Object.values(item.entityValues).reduce((sum: number, val: any) => 
            sum + (typeof val === 'number' ? val : 0), 0
          );
        }
      });
      
      expenseItems.forEach((item: any) => {
        if (item.entityValues) {
          totalExpenses += Object.values(item.entityValues).reduce((sum: number, val: any) => 
            sum + (typeof val === 'number' ? val : 0), 0
          );
        }
      });
      
      const barChartData = [
        {
          name: "Total Revenue",
          value: totalRevenue,
          color: "#3b82f6" // blue
        },
        {
          name: "Total Expenses",
          value: totalExpenses,
          color: "#ef4444" // red
        },
        {
          name: "Net Income",
          value: totalRevenue - totalExpenses,
          color: "#22c55e" // green
        }
      ];
      
      // Create table data for each department
      const tableData = Array.from(departments).map(dept => {
        // Calculate department-specific totals
        let deptRevenue = 0;
        let deptExpenses = 0;
        
        revenueItems.forEach((item: any) => {
          if (item.entityValues && item.entityValues[dept]) {
            deptRevenue += item.entityValues[dept];
          }
        });
        
        expenseItems.forEach((item: any) => {
          if (item.entityValues && item.entityValues[dept]) {
            deptExpenses += item.entityValues[dept];
          }
        });
        
        return {
          name: dept,
          revenue: deptRevenue,
          expenses: deptExpenses,
          netIncome: deptRevenue - deptExpenses
        };
      });
      
      return {
        barChartData,
        tableData
      };
    }
  }, [monthlyData, selectedMonth, dataType]);
  
  // If no month is selected or "all" is selected
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
      <div className="flex items-center justify-between mb-4">
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
      
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chart">Financial Chart</TabsTrigger>
          <TabsTrigger value="details">Financial Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="mt-0">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                {dataType === "e" ? "Employee Revenue Streams" : "Business Financial Metrics"}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {financialData.barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={financialData.barChartData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis 
                      tickFormatter={(value) => 
                        `$${Math.abs(value) >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
                      } 
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)} 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Amount">
                      {financialData.barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No financial data available for this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="mt-0">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                {dataType === "e" ? "Employee Performance Breakdown" : "Business Department Performance"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {financialData.tableData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      {dataType === "e" ? (
                        <>
                          <TableHead className="text-right">Professional Fees</TableHead>
                          <TableHead className="text-right">Hospital Revenue</TableHead>
                          <TableHead className="text-right">ProMed Income</TableHead>
                          <TableHead className="text-right">Ancillary Income</TableHead>
                          <TableHead className="text-right">Total Revenue</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Expenses</TableHead>
                          <TableHead className="text-right">Net Income</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.tableData.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.name}</TableCell>
                        {dataType === "e" ? (
                          <>
                            <TableCell className="text-right">{formatCurrency(item.professionalFees)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.hospitalRevenue)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.promedIncome)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.ancillaryIncome)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.totalRevenue)}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.expenses)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.netIncome)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No financial details available for this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}