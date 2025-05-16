import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useStore } from "@/store/data-store";

// Mock data
const departmentData = [
  { name: "Cardiology", revenue: 405780, expenses: 325120, net: 80660 },
  { name: "Orthopedics", revenue: 358450, expenses: 298340, net: 60110 },
  { name: "MRI", revenue: 245780, expenses: 198560, net: 47220 },
  { name: "Geriatric Practice", revenue: 178450, expenses: 221030, net: -42580 },
  { name: "Physical Therapy", revenue: 112340, expenses: 143580, net: -31240 }
];

const COLORS = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC'];

export default function DepartmentAnalysis() {
  const { uploadStatus } = useStore();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewType, setViewType] = useState<string>("annual");

  // Filter data based on selected department
  const filteredData = selectedDepartment === "all" 
    ? departmentData 
    : departmentData.filter(dept => dept.name === selectedDepartment);

  const ancillaryData = [
    { name: "Revenue", value: 968210 },
    { name: "Expenses", value: 425180 },
    { name: "Profit", value: 543030 }
  ];

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
              <SelectValue placeholder="Annual View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Annual View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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

      {!uploadStatus.annual && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="bg-blue-50 border border-primary-light rounded-lg p-4 flex items-start">
              <span className="material-icons text-primary mr-3 mt-0.5">info</span>
              <div>
                <h3 className="font-medium text-primary">Data Required</h3>
                <p className="text-sm text-neutral-dark mt-1">
                  Please upload the Annual Consolidated CSV file to view department analysis metrics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadStatus.annual && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Department Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#42A5F5" />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF5350" />
                  <Bar dataKey="net" name="Net Income" fill="#66BB6A" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Unit-Level Heatmap (Visualization alternative) */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ancillary ROI Dashboard */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ancillary ROI Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ancillaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#42A5F5" />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-neutral-text mb-1">Ancillary Revenue</p>
                    <p className="text-xl font-semibold numeric text-primary">$968,210</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-neutral-text mb-1">Ancillary Expenses</p>
                    <p className="text-xl font-semibold numeric text-primary">$425,180</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-neutral-text mb-1">Profit Margin</p>
                    <p className="text-xl font-semibold numeric text-positive">56.1%</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-neutral-text mb-1">ROI</p>
                    <p className="text-xl font-semibold numeric text-positive">128%</p>
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
                          {((dept.net / dept.revenue) * 100).toFixed(1)}%
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
