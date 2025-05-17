import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/data-store";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FileBarChart, Users, Building2, FileText } from "lucide-react";

// Navigation tabs for the top of the page
const navigationTabs = [
  { id: "employee", name: "Employee Data (E)", icon: <Users className="w-4 h-4 mr-2" /> },
  { id: "business", name: "Business Data (O)", icon: <Building2 className="w-4 h-4 mr-2" /> },
  { id: "overview", name: "Overview", icon: <FileBarChart className="w-4 h-4 mr-2" /> },
  { id: "details", name: "Details", icon: <FileText className="w-4 h-4 mr-2" /> },
];

export default function DataAnalysis() {
  const { monthlyData } = useStore();
  const [activeTab, setActiveTab] = useState<string>("employee");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLineItem, setSelectedLineItem] = useState<string>("all");

  // Get available months with data
  const availableMonths = useMemo(() => {
    if (!monthlyData) return [];
    return Object.keys(monthlyData).sort();
  }, [monthlyData]);

  // Set first month as default when data is loaded
  useEffect(() => {
    if (availableMonths.length > 0 && selectedMonth === "all") {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Extract employee data from the monthly E-type CSV files
  const employeeData = useMemo(() => {
    if (!monthlyData || !selectedMonth || selectedMonth === "all") return [];
    
    const eData = monthlyData[selectedMonth]?.e;
    if (!eData || !eData.lineItems || !eData.entityColumns) return [];
    
    // Get all employees from entity columns
    const employees = eData.entityColumns.filter((col: string) => 
      col !== 'Line Item' && 
      !col.toLowerCase().includes('total') && 
      !col.toLowerCase().includes('summary')
    );
    
    // Get all unique line items
    const lineItems = eData.lineItems.map((item: any) => ({
      name: item.name,
      depth: item.depth,
      isTotal: !!item.isTotal,
    }));
    
    // Create a mapping of line items to employee values
    const lineItemsData = eData.lineItems.map((item: any) => {
      const values: Record<string, any> = { name: item.name, depth: item.depth, isTotal: !!item.isTotal };
      
      employees.forEach((emp: string) => {
        if (item.entityValues && item.entityValues[emp] !== undefined) {
          values[emp] = item.entityValues[emp];
        } else {
          values[emp] = 0;
        }
      });
      
      return values;
    });
    
    return {
      employees,
      lineItems,
      lineItemsData,
    };
  }, [monthlyData, selectedMonth]);

  // Extract business department data from the monthly O-type CSV files
  const businessData = useMemo(() => {
    if (!monthlyData || !selectedMonth || selectedMonth === "all") return [];
    
    const oData = monthlyData[selectedMonth]?.o;
    if (!oData || !oData.lineItems || !oData.entityColumns) return [];
    
    // Get all departments from entity columns
    const departments = oData.entityColumns.filter((col: string) => 
      col !== 'Line Item' && 
      !col.toLowerCase().includes('total') && 
      !col.toLowerCase().includes('summary')
    );
    
    // Get all unique line items
    const lineItems = oData.lineItems.map((item: any) => ({
      name: item.name,
      depth: item.depth,
      isTotal: !!item.isTotal,
    }));
    
    // Create a mapping of line items to department values
    const lineItemsData = oData.lineItems.map((item: any) => {
      const values: Record<string, any> = { name: item.name, depth: item.depth, isTotal: !!item.isTotal };
      
      departments.forEach((dept: string) => {
        if (item.entityValues && item.entityValues[dept] !== undefined) {
          values[dept] = item.entityValues[dept];
        } else {
          values[dept] = 0;
        }
      });
      
      return values;
    });
    
    return {
      departments,
      lineItems,
      lineItemsData,
    };
  }, [monthlyData, selectedMonth]);

  // Get unique line items for filtering based on active tab
  const availableLineItems = useMemo(() => {
    let items = [];
    
    if (activeTab === "employee" && employeeData.lineItems) {
      // Create a Set to ensure uniqueness by name
      const uniqueNames = new Set<string>();
      
      items = employeeData.lineItems
        .filter((item: any) => {
          if (item.name && !uniqueNames.has(item.name)) {
            uniqueNames.add(item.name);
            return true;
          }
          return false;
        })
        .map((item: any, index: number) => ({
          ...item,
          // Create a unique id for each item
          id: `employee-${index}-${Math.random().toString(36).substr(2, 5)}`
        }));
    } else if (activeTab === "business" && businessData.lineItems) {
      // Create a Set to ensure uniqueness by name
      const uniqueNames = new Set<string>();
      
      items = businessData.lineItems
        .filter((item: any) => {
          if (item.name && !uniqueNames.has(item.name)) {
            uniqueNames.add(item.name);
            return true;
          }
          return false;
        })
        .map((item: any, index: number) => ({
          ...item,
          // Create a unique id for each item
          id: `business-${index}-${Math.random().toString(36).substr(2, 5)}`
        }));
    }
    
    return items;
  }, [activeTab, employeeData, businessData]);

  // Filter line items data based on search term and selected line item
  const filteredLineItemsData = useMemo(() => {
    let data = [];
    
    if (activeTab === "employee" && employeeData.lineItemsData) {
      data = employeeData.lineItemsData;
    } else if (activeTab === "business" && businessData.lineItemsData) {
      data = businessData.lineItemsData;
    }
    
    // Add a unique identifier to each item if it doesn't have one
    const dataWithIds = data.map((item: any, index: number) => {
      if (!item.id) {
        return { ...item, id: `item-${index}-${Math.random().toString(36).substr(2, 9)}` };
      }
      return item;
    });
    
    return dataWithIds.filter((item: any) => {
      // Filter by search term
      const matchesSearch = searchTerm === "" || 
        (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by selected line item
      const matchesLineItem = selectedLineItem === "all" || 
        item.name === selectedLineItem;
      
      return matchesSearch && matchesLineItem;
    });
  }, [activeTab, employeeData, businessData, searchTerm, selectedLineItem]);

  // Format currency values for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-4">Financial Data Analysis</h1>
      
      {/* Top Navigation Tabs */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 p-0 rounded-lg shadow-md">
            {navigationTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex-1 py-3 rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center">
                  {tab.icon}
                  <span>{tab.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Filters Section */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="month-select">Select Month</Label>
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger id="month-select">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month.charAt(0).toUpperCase() + month.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search-input">Search Line Items</Label>
              <Input
                id="search-input"
                placeholder="Search by line item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="line-item-select">Filter by Line Item</Label>
              <Select
                value={selectedLineItem}
                onValueChange={setSelectedLineItem}
              >
                <SelectTrigger id="line-item-select">
                  <SelectValue placeholder="Select Line Item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Line Items</SelectItem>
                  {availableLineItems
                    .filter((item: any) => item.name && item.name.trim() !== "")
                    .map((item: any) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Employee Data Tab Content */}
          <TabsContent value="employee">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Employee Financial Data
                </CardTitle>
                <CardDescription>
                  {selectedMonth !== "all" 
                    ? `Analysis of employee financial data for ${selectedMonth}` 
                    : "Select a month to view employee financial data"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMonth === "all" ? (
                  <div className="text-center p-6">Please select a month to view data</div>
                ) : employeeData.employees && employeeData.employees.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="w-full overflow-auto">
                      <Table>
                        <TableCaption>Employee Financial Data for {selectedMonth}</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px] sticky left-0 bg-background">Line Item</TableHead>
                            {employeeData.employees.map((employee: string) => (
                              <TableHead key={employee} className="min-w-[150px]">{employee}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLineItemsData.map((item: any, idx: number) => (
                            <TableRow key={`${item.name}-${idx}`} className={item.isTotal ? "font-bold bg-muted/50" : ""}>
                              <TableCell 
                                className={`sticky left-0 bg-background ${item.isTotal ? "font-bold" : ""}`}
                                style={{ paddingLeft: `${item.depth * 16}px` }}
                              >
                                {item.name}
                                {item.isTotal && <Badge className="ml-2 bg-primary">Total</Badge>}
                              </TableCell>
                              {employeeData.employees.map((employee: string) => (
                                <TableCell key={`${employee}-${idx}`}>
                                  {typeof item[employee] === 'number' ? formatCurrency(item[employee]) : item[employee] || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center p-6">No employee data available for the selected month</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Business Data Tab Content */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Business Department Data
                </CardTitle>
                <CardDescription>
                  {selectedMonth !== "all" 
                    ? `Analysis of business department data for ${selectedMonth}` 
                    : "Select a month to view business department data"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMonth === "all" ? (
                  <div className="text-center p-6">Please select a month to view data</div>
                ) : businessData.departments && businessData.departments.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="w-full overflow-auto">
                      <Table>
                        <TableCaption>Business Department Data for {selectedMonth}</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px] sticky left-0 bg-background">Line Item</TableHead>
                            {businessData.departments.map((department: string) => (
                              <TableHead key={department} className="min-w-[150px]">{department}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLineItemsData.map((item: any, idx: number) => (
                            <TableRow key={`${item.name}-${idx}`} className={item.isTotal ? "font-bold bg-muted/50" : ""}>
                              <TableCell 
                                className={`sticky left-0 bg-background ${item.isTotal ? "font-bold" : ""}`}
                                style={{ paddingLeft: `${item.depth * 16}px` }}
                              >
                                {item.name}
                                {item.isTotal && <Badge className="ml-2 bg-primary">Total</Badge>}
                              </TableCell>
                              {businessData.departments.map((department: string) => (
                                <TableCell key={`${department}-${idx}`}>
                                  {typeof item[department] === 'number' ? formatCurrency(item[department]) : item[department] || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center p-6">No business department data available for the selected month</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Overview Tab Content */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileBarChart className="w-5 h-5 mr-2" />
                  Financial Overview
                </CardTitle>
                <CardDescription>
                  High-level summary of key financial metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="text-lg font-medium mb-2">Employee Data Summary</h3>
                    <p className="text-muted-foreground mb-4">
                      Key financial metrics for doctors and employees
                    </p>
                    {selectedMonth !== "all" && employeeData.employees && employeeData.employees.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Number of Employees:</span>
                          <span className="font-medium">{employeeData.employees.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Line Items:</span>
                          <span className="font-medium">{employeeData.lineItemsData.length}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        Select a month to view summary data
                      </div>
                    )}
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-lg font-medium mb-2">Business Data Summary</h3>
                    <p className="text-muted-foreground mb-4">
                      Key financial metrics for business departments
                    </p>
                    {selectedMonth !== "all" && businessData.departments && businessData.departments.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Number of Departments:</span>
                          <span className="font-medium">{businessData.departments.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Line Items:</span>
                          <span className="font-medium">{businessData.lineItemsData.length}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        Select a month to view summary data
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Details Tab Content */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Detailed Analysis
                </CardTitle>
                <CardDescription>
                  In-depth analysis of financial data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Data Structure Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h4 className="text-md font-medium mb-2">E-File Structure</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Employee (E) files contain doctor and employee financial data.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Columns represent individual doctors/employees</li>
                          <li>Rows represent financial line items</li>
                          <li>Data includes revenue, expenses and net income</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h4 className="text-md font-medium mb-2">O-File Structure</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Business (O) files contain department financial data.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Columns represent business departments</li>
                          <li>Rows represent financial line items</li>
                          <li>Data includes revenue, expenses and operating costs</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}