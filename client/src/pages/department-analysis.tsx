import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useStore } from "@/store/data-store";
import { extractDepartmentPerformanceData, extractAncillaryMetrics, extractMonthlyPerformanceTrend } from "@/lib/performance-utils";

// Consistent colors for visualizations
const COLORS = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC'];

export default function DepartmentAnalysis() {
  const { uploadStatus, monthlyData } = useStore();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewType, setViewType] = useState<string>("department");

  // Extract real department data from monthly CSV files
  const departmentData = useMemo(() => {
    return extractDepartmentPerformanceData(monthlyData);
  }, [monthlyData]);
  
  // Extract monthly performance trend
  const monthlyTrend = useMemo(() => {
    return extractMonthlyPerformanceTrend(monthlyData);
  }, [monthlyData]);
  
  // Extract ancillary service metrics
  const ancillaryMetrics = useMemo(() => {
    return extractAncillaryMetrics(monthlyData);
  }, [monthlyData]);
  
  // Format data for ancillary chart
  const ancillaryData = useMemo(() => [
    { name: "Revenue", value: ancillaryMetrics.revenue },
    { name: "Expenses", value: ancillaryMetrics.expenses },
    { name: "Profit", value: ancillaryMetrics.revenue - ancillaryMetrics.expenses }
  ], [ancillaryMetrics]);

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
          <p className="text-neutral-text">Analyze service line and department performance</p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-3">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Department View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Department View</SelectItem>
              <SelectItem value="ancillary">Ancillary Services</SelectItem>
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
                  Please upload Monthly Other Business CSV files to view department analysis metrics.
                  For best results, upload data for multiple months.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Department Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={filteredData} 
                  margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={50}
                    interval={0}
                    tick={{ fontSize: 12 }}
                    tickMargin={5}
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
                    wrapperStyle={{ paddingTop: 10 }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#42A5F5" />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF5350" />
                  <Bar dataKey="net" name="Net Income" fill="#66BB6A" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="revenue"
                      nameKey="name"
                      label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                      paddingAngle={2}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `$${value.toLocaleString()}`} 
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
                  <p>No revenue distribution data available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ancillary ROI Dashboard */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ancillary Services ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={ancillaryData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      width={80}
                    />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar 
                      dataKey="value" 
                      name="Amount" 
                      fill="#42A5F5"
                      barSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-neutral-text mb-1">Ancillary Revenue</p>
                    <p className="text-xl font-semibold numeric text-primary">
                      ${ancillaryMetrics.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-neutral-text mb-1">Ancillary Expenses</p>
                    <p className="text-xl font-semibold numeric text-primary">
                      ${ancillaryMetrics.expenses.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-neutral-text mb-1">Profit Margin</p>
                    <p className={`text-xl font-semibold numeric ${ancillaryMetrics.profitMargin >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {ancillaryMetrics.profitMargin}%
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-neutral-text mb-1">ROI</p>
                    <p className={`text-xl font-semibold numeric ${ancillaryMetrics.roi >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {ancillaryMetrics.roi}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Comparison Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Department Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {departmentData.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-32 text-center text-muted-foreground">
                  <p>No department data available. Please upload monthly Other Business files.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
