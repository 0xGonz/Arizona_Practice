import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useStore } from "@/store/data-store";

// Mock data
const doctorData = [
  { name: "Dr. Jennifer Smith", revenue: 95450, expenses: 72340, net: 23110 },
  { name: "Dr. Robert Johnson", revenue: 82340, expenses: 65780, net: 16560 },
  { name: "Dr. Maria Chen", revenue: 78520, expenses: 68920, net: 9600 },
  { name: "Dr. David Williams", revenue: 65780, expenses: 52450, net: 13330 },
  { name: "Dr. Alex Peterson", revenue: 62340, expenses: 50780, net: 11560 }
];

export default function DoctorPerformance() {
  const { uploadStatus } = useStore();
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [viewType, setViewType] = useState<string>("annual");

  // Filter data based on selected doctor
  const filteredData = selectedDoctor === "all" 
    ? doctorData 
    : doctorData.filter(doc => doc.name === selectedDoctor);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark mb-1">Doctor Performance</h1>
          <p className="text-neutral-text">Analyze individual provider financial metrics</p>
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
          
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-[220px] bg-white">
              <SelectValue placeholder="All Doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctorData.map(doc => (
                <SelectItem key={doc.name} value={doc.name}>{doc.name}</SelectItem>
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
                  Please upload the Annual Consolidated CSV file to view doctor performance metrics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadStatus.annual && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profitability Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Profitability Chart</CardTitle>
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

          {/* Expense Composition */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Composition</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  layout="vertical" 
                  data={[
                    { name: "Payroll", value: 159780 },
                    { name: "Operating", value: 35680 },
                    { name: "Admin", value: 26190 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="value" name="Amount" fill="#42A5F5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend View */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={[
                    { month: "Jan", revenue: 95450, expenses: 72340, net: 23110 },
                    { month: "Feb", revenue: 88720, expenses: 70560, net: 18160 },
                    { month: "Mar", revenue: 92340, expenses: 71250, net: 21090 },
                    { month: "Apr", revenue: 86550, expenses: 70120, net: 16430 },
                    { month: "May", revenue: 94780, expenses: 73450, net: 21330 },
                    { month: "Jun", revenue: 89520, expenses: 72340, net: 17180 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
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

          {/* Comparison Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Provider Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-border">
                      <th className="text-left py-3 px-4 font-medium">Provider</th>
                      <th className="text-right py-3 px-4 font-medium">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium">Expenses</th>
                      <th className="text-right py-3 px-4 font-medium">Net Income</th>
                      <th className="text-right py-3 px-4 font-medium">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorData.map((doc, index) => (
                      <tr key={index} className="border-b border-neutral-border">
                        <td className="py-3 px-4 font-medium">{doc.name}</td>
                        <td className="text-right py-3 px-4 numeric">${doc.revenue.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 numeric">${doc.expenses.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 numeric font-medium text-positive">${doc.net.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 numeric font-medium text-positive">
                          {((doc.net / doc.revenue) * 100).toFixed(1)}%
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
