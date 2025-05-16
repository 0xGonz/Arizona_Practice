import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useStore } from "@/store/data-store";
import { extractDoctorPerformanceData, extractMonthlyPerformanceTrend } from "@/lib/performance-utils";

export default function DoctorPerformance() {
  const { uploadStatus, monthlyData } = useStore();
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [viewType, setViewType] = useState<string>("performance");

  // Extract real data from monthly CSV files
  const doctorData = useMemo(() => {
    return extractDoctorPerformanceData(monthlyData);
  }, [monthlyData]);

  // Extract monthly performance trend
  const monthlyTrend = useMemo(() => {
    return extractMonthlyPerformanceTrend(monthlyData);
  }, [monthlyData]);

  // Generate expense categories - extract from provider expense data
  const expenseCategories = useMemo(() => {
    // This is a simplified approach - in a real production app, we'd have more detailed
    // categorization of expense types
    const totalExpenses = doctorData.reduce((sum, doc) => sum + doc.expenses, 0);

    // Estimate the breakdown of expenses based on common healthcare practice patterns
    // In a real app, these would be calculated from actual expense line items
    return [
      { name: "Provider Salary", value: Math.round(totalExpenses * 0.65) }, // ~65% of expenses
      { name: "Operating", value: Math.round(totalExpenses * 0.25) },       // ~25% of expenses
      { name: "Admin", value: Math.round(totalExpenses * 0.10) }            // ~10% of expenses
    ];
  }, [doctorData]);

  // Filter data based on selected doctor
  const filteredData = useMemo(() => {
    return selectedDoctor === "all" 
      ? doctorData 
      : doctorData.filter(doc => doc.name === selectedDoctor);
  }, [doctorData, selectedDoctor]);

  // Check if we have any doctor data
  const hasData = doctorData.length > 0;

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
              <SelectValue placeholder="Performance View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance View</SelectItem>
              <SelectItem value="trend">Trend View</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor} disabled={!hasData}>
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

      {!hasData && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="bg-blue-50 border border-primary-light rounded-lg p-4 flex items-start">
              <span className="material-icons text-primary mr-3 mt-0.5">info</span>
              <div>
                <h3 className="font-medium text-primary">Data Required</h3>
                <p className="text-sm text-neutral-dark mt-1">
                  Please upload Monthly Employee CSV files to view doctor performance metrics.
                  For best results, upload data for multiple months.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profitability Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Profitability</CardTitle>
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
                  data={expenseCategories}
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
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyTrend}>
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
              ) : (
                <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
                  <p>No monthly trend data available. Please upload monthly data for more months.</p>
                </div>
              )}
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
                        <td className={`text-right py-3 px-4 numeric font-medium ${doc.net >= 0 ? 'text-positive' : 'text-negative'}`}>
                          ${Math.abs(doc.net).toLocaleString()}{doc.net < 0 ? ' (Loss)' : ''}
                        </td>
                        <td className={`text-right py-3 px-4 numeric font-medium ${doc.net >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {doc.revenue > 0 ? ((doc.net / doc.revenue) * 100).toFixed(1) : '0.0'}%
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
