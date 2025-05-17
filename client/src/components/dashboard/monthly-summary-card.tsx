import { useState } from "react";
import { ArrowUpIcon, ArrowDownIcon, InfoIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MonthlyBreakdown {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

interface MonthlySummaryCardProps {
  title: string;
  fileType: "e" | "o";
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export default function MonthlySummaryCard({
  title,
  fileType,
  totalRevenue,
  totalExpenses,
  netIncome,
  monthlyBreakdown
}: MonthlySummaryCardProps) {
  const [view, setView] = useState<"summary" | "table">("summary");
  
  // Format dollar amounts
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          {title}
          <div className={`px-2 py-1 text-xs rounded-full ${fileType === "e" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
            {fileType === "e" ? "E" : "O"}-Files
          </div>
        </CardTitle>
        <CardDescription className="flex justify-between">
          <span>Monthly financial data summary</span>
        </CardDescription>
        <Tabs defaultValue="summary" className="w-full"
          onValueChange={(value) => setView(value as "summary" | "table")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="px-2 pt-0 pb-2">
        {view === "summary" && (
          <div className="space-y-4 mt-2">
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="text-sm text-neutral-text">Total Revenue</div>
              <div className="text-xl font-semibold text-blue-600">{formatCurrency(totalRevenue)}</div>
              <Progress 
                value={totalRevenue > 0 ? 100 : 0} 
                className="h-2 mt-2 bg-blue-100" 
              />
            </div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="text-sm text-neutral-text">Total Expenses</div>
              <div className="text-xl font-semibold text-red-600">{formatCurrency(totalExpenses)}</div>
              <Progress 
                value={totalExpenses > 0 ? 100 : 0} 
                className="h-2 mt-2 bg-red-100" 
              />
            </div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="text-sm text-neutral-text">Net Income</div>
              <div className={`text-xl font-semibold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netIncome)}
              </div>
              <div className="flex items-center mt-1">
                <div className={`text-xs px-2 py-0.5 rounded-full flex items-center ${
                  netIncome >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {netIncome >= 0 ? (
                    <ArrowUpIcon className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownIcon className="w-3 h-3 mr-1" />
                  )}
                  {totalRevenue > 0 ? Math.abs(Math.round((netIncome / totalRevenue) * 100)) : 0}% margin
                </div>
              </div>
              
              <Progress 
                value={Math.abs(netIncome) > 0 ? 100 : 0} 
                className={`h-2 mt-2 ${netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}
              />
            </div>
          </div>
        )}
        
        {view === "table" && (
          <div className="rounded-lg border overflow-hidden mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyBreakdown.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.month}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(item.expenses)}</TableCell>
                    <TableCell className={`text-right ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.net)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-gray-50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right text-blue-600">{formatCurrency(totalRevenue)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(totalExpenses)}</TableCell>
                  <TableCell className={`text-right ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netIncome)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}