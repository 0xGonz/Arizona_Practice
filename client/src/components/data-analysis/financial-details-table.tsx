import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Users } from "lucide-react";

interface FinancialDetailsTableProps {
  type: "employee" | "business";
  data: Array<{
    name: string;
    revenue: number;
    expenses: number;
    netIncome: number;
    payroll: number;
  }>;
  title?: string;
}

export function FinancialDetailsTable({ 
  type, 
  data, 
  title 
}: FinancialDetailsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-medium">
          {type === "employee" ? (
            <><Users className="w-5 h-5 mr-2" /> {title || "Employee Breakdown"}</>
          ) : (
            <><Building2 className="w-5 h-5 mr-2" /> {title || "Department Breakdown"}</>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        {data && data.length > 0 ? (
          <ScrollArea className="h-full">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 border-b">
                    {type === "employee" ? "Employee" : "Department"}
                  </th>
                  <th className="text-right p-2 border-b">Revenue</th>
                  <th className="text-right p-2 border-b">Expenses</th>
                  <th className="text-right p-2 border-b">Net Income</th>
                  <th className="text-right p-2 border-b">Payroll Expense</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={`item-${idx}`} className="hover:bg-muted/30">
                    <td className="p-2 border-b">{item.name}</td>
                    <td className="text-right p-2 border-b text-blue-600">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="text-right p-2 border-b text-red-600">
                      {formatCurrency(item.expenses)}
                    </td>
                    <td className={`text-right p-2 border-b ${item.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.netIncome)}
                    </td>
                    <td className="text-right p-2 border-b">
                      {formatCurrency(item.payroll)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              No {type === "employee" ? "employee" : "department"} data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}