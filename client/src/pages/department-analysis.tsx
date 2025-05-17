import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useStore } from "@/store/data-store";
import { extractDepartmentPerformanceData } from "@/lib/department-utils-new";
import { extractMonthlyPerformanceTrend } from "@/lib/performance-utils";
import { Badge } from "@/components/ui/badge";

export default function DepartmentAnalysis() {
  const { uploadStatus, monthlyData } = useStore();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewType, setViewType] = useState<string>("performance");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  
  // Get available months with 'o' data
  const availableMonths = useMemo(() => {
    if (!monthlyData) return [];
    
    const months = Object.keys(monthlyData)
      .filter(month => {
        const oData = monthlyData[month]?.o;
        return oData && oData.lineItems && oData.lineItems.length > 0;
      })
      .sort();
    
    console.log("Department Analysis - Available months with o data:", months);
    return months;
  }, [monthlyData]);
  
  // Keep "all" as the default view, don't auto-select first month
  // This comment left to document the change from previous behavior
  
  // Extract department data from the monthly CSV files based on selected month
  const departmentData = useMemo(() => {
    console.log(`Extracting department data for month: ${selectedMonth}`);
    
    // If "all" is selected, use all months data
    if (selectedMonth === "all") {
      return extractDepartmentPerformanceData(monthlyData);
    }
    
    // Otherwise, create a filtered version of monthlyData with just the selected month
    const filteredMonthlyData = { 
      [selectedMonth]: monthlyData[selectedMonth] 
    };
    
    return extractDepartmentPerformanceData(filteredMonthlyData);
  }, [monthlyData, selectedMonth]);

  // Extract monthly performance trend
  const monthlyTrend = useMemo(() => {
    return extractMonthlyPerformanceTrend(monthlyData, 'o');
  }, [monthlyData]);

  // Removed expense categories as we no longer need the expense composition section

  // Filter data based on selected department
  const filteredData = useMemo(() => {
    return selectedDepartment === "all" 
      ? departmentData 
      : departmentData.filter(dept => dept.name === selectedDepartment);
  }, [departmentData, selectedDepartment]);

  // Check if we have any department data
  const hasData = departmentData.length > 0;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark mb-1">Department Analysis</h1>
          <p className="text-neutral-text">Analyze department financial metrics by cost center</p>
          {selectedMonth !== "all" && (
            <Badge variant="outline" className="mt-2 bg-blue-50 hover:bg-blue-100 text-primary border-primary">
              {selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)} Data
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap mt-4 md:mt-0 gap-3">
          {availableMonths.length > 0 && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.length > 1 && (
                  <SelectItem value="all">All Months</SelectItem>
                )}
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {month.charAt(0).toUpperCase() + month.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Performance View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance View</SelectItem>
              <SelectItem value="trend">Trend View</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={!hasData}>
            <SelectTrigger className="w-[220px] bg-white">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentData.map(dept => (
                <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasData && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="bg-blue-50 border border-primary-light rounded-lg p-4 flex items-start">
              <span className="material-icons text-primary mr-3 mt-0.5">info</span>
              <div>
                <h3 className="font-medium text-primary">Data Required</h3>
                <p className="text-sm text-neutral-dark mt-1">
                  Please upload Monthly O-type CSV files to view department performance metrics.
                  For best results, upload data for multiple months.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend View */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={monthlyTrend}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value) => `$${value.toLocaleString()}`}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 15 }}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="#42A5F5" />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF5350" />
                    <Bar dataKey="net" name="Net Income" fill="#66BB6A" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
                  <p>No monthly trend data available. Please upload monthly data for more months.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profitability Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Department Profitability</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart 
                  data={filteredData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                    tickMargin={15}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value.toLocaleString()}`} 
                    width={80}
                  />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: 15 }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#42A5F5" />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF5350" />
                  <Bar dataKey="net" name="Net Income" fill="#66BB6A" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Department Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-border">
                      <th className="text-left py-3 px-4 font-medium">Department</th>
                      <th className="text-right py-3 px-4 font-medium">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium">Expenses</th>
                      <th className="text-right py-3 px-4 font-medium">Net Income</th>
                      <th className="text-right py-3 px-4 font-medium">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentData.map((dept, index) => (
                      <tr key={index} className="border-b border-neutral-border">
                        <td className="py-3 px-4 font-medium">{dept.name}</td>
                        <td className="text-right py-3 px-4 numeric">${dept.revenue.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 numeric">${dept.expenses.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 numeric font-medium ${dept.net >= 0 ? 'text-positive' : 'text-negative'}`}>
                          ${Math.abs(dept.net).toLocaleString()}{dept.net < 0 ? ' (Loss)' : ''}
                        </td>
                        <td className={`text-right py-3 px-4 numeric font-medium ${dept.net >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {dept.revenue > 0 ? ((dept.net / dept.revenue) * 100).toFixed(1) : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}