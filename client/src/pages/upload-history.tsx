import React, { useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Trash, FileSpreadsheet, Calendar, Eye, ChevronDown, ChevronUp, X } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CSVType } from "@/types";

export default function UploadHistory() {
  const { uploadHistory, uploadStatus, clearUploadedData, annualData, monthlyData } = useStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("list");
  
  // Format the date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Get type display name
  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'annual':
        return 'Annual Data';
      case 'monthly-e':
        return 'Monthly Employee';
      case 'monthly-o':
        return 'Monthly Other';
      default:
        return type;
    }
  };
  
  // Handle delete for specific upload
  const handleDelete = (type: string, month?: string) => {
    // Generate a unique key for this item to confirm deletion
    const deleteKey = `${type}-${month || 'annual'}`;
    
    if (confirmDelete === deleteKey) {
      // User has confirmed, proceed with deletion
      clearUploadedData(type as any, month);  // Type cast to fix type issue
      setConfirmDelete(null);
      setExpandedItem(null);
    } else {
      // Ask for confirmation
      setConfirmDelete(deleteKey);
    }
  };
  
  // Toggle expanded view for an item
  const toggleExpand = (key: string) => {
    if (expandedItem === key) {
      setExpandedItem(null);
    } else {
      setExpandedItem(key);
    }
  };
  
  // Get file details based on type and month
  const getFileData = (type: CSVType, month?: string) => {
    if (type === 'annual') {
      return annualData;
    } else if (type === 'monthly-e' && month) {
      return monthlyData[month]?.e;
    } else if (type === 'monthly-o' && month) {
      return monthlyData[month]?.o;
    }
    return null;
  };
  
  // Group history by month and type
  const groupedHistory = uploadHistory.reduce((acc, item) => {
    const key = item.month ? `${item.month}` : 'annual';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof uploadHistory>);
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark mb-1">Upload History</h1>
        <p className="text-neutral-text mb-4">Manage your uploaded financial data files</p>
        
        <div className="flex gap-2 mb-6">
          <Link href="/upload">
            <Button>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Upload New Data
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            onClick={() => setConfirmDelete('all')}
            className={confirmDelete === 'all' ? 'bg-red-50 border-red-300 text-red-600' : ''}
          >
            <Trash className="w-4 h-4 mr-2" />
            {confirmDelete === 'all' ? 'Confirm Clear All?' : 'Clear All Data'}
          </Button>
          
          {confirmDelete === 'all' && (
            <Button 
              variant="destructive"
              onClick={() => {
                clearUploadedData('all');
                setConfirmDelete(null);
              }}
            >
              Yes, Delete All Data
            </Button>
          )}
        </div>
        
        {Object.keys(groupedHistory).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No upload history found.</p>
              <p className="mt-2">
                <Link href="/upload">
                  <Button variant="outline" className="mt-4">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Go to Upload Page
                  </Button>
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="data">Data Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-0">
              <div className="grid gap-6">
                {/* Annual Data */}
                {groupedHistory['annual'] && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Annual Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Filename</th>
                            <th className="text-left py-2 px-4">Upload Date</th>
                            <th className="text-right py-2 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedHistory['annual'].map((item, index) => {
                            const itemKey = `${item.type}-annual`;
                            const isExpanded = expandedItem === itemKey;
                            
                            return (
                              <Fragment key={index}>
                                <tr className="border-b">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      <FileSpreadsheet className="w-4 h-4 mr-2 text-muted-foreground" />
                                      {item.filename}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {formatDate(item.date)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpand(itemKey)}
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        {isExpanded ? 'Hide' : 'View'}
                                      </Button>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(item.type)}
                                        className={confirmDelete === itemKey ? 'text-red-600' : ''}
                                      >
                                        <Trash className="w-4 h-4" />
                                        {confirmDelete === itemKey ? 'Confirm?' : ''}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                                
                                {/* Expanded Data Preview */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={3} className="p-0">
                                      <div className="bg-slate-50 p-4 rounded-lg my-2">
                                        <div className="flex justify-between mb-2">
                                          <h4 className="font-semibold">Data Preview</h4>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setExpandedItem(null)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        
                                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                          {annualData && annualData.length > 0 ? (
                                            <>
                                              <table className="w-full text-sm">
                                                <thead className="bg-slate-200">
                                                  <tr>
                                                    {Object.keys(annualData[0]).map((key, idx) => (
                                                      <th key={idx} className="py-2 px-3 text-left font-medium">
                                                        {key}
                                                      </th>
                                                    ))}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {annualData.slice(0, 10).map((row, rowIdx) => (
                                                    <tr key={rowIdx} className="border-b border-slate-200">
                                                      {Object.entries(row).map(([key, value], cellIdx) => (
                                                        <td key={cellIdx} className="py-2 px-3">
                                                          {String(value)}
                                                        </td>
                                                      ))}
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                              
                                              {annualData.length > 10 && (
                                                <div className="mt-2 text-sm text-neutral-500 text-center">
                                                  Showing 10 of {annualData.length} rows. Visit the Dashboard to see full analysis.
                                                </div>
                                              )}
                                            </>
                                          ) : (
                                            <p className="text-neutral-500">No data available to preview.</p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                )}
                
                {/* Monthly Data */}
                {Object.keys(groupedHistory)
                  .filter(key => key !== 'annual')
                  .map(month => (
                    <Card key={month}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          {month.charAt(0).toUpperCase() + month.slice(1)} Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Type</th>
                              <th className="text-left py-2 px-4">Filename</th>
                              <th className="text-left py-2 px-4">Upload Date</th>
                              <th className="text-right py-2 px-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedHistory[month].map((item, index) => {
                              const itemKey = `${item.type}-${item.month}`;
                              const isExpanded = expandedItem === itemKey;
                              const fileData = getFileData(item.type as CSVType, item.month);
                              
                              return (
                                <Fragment key={index}>
                                  <tr className="border-b">
                                    <td className="py-3 px-4">
                                      <Badge variant={item.type.includes('e') ? 'default' : 'outline'}>
                                        {getTypeDisplay(item.type)}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center">
                                        <FileSpreadsheet className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {item.filename}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      {formatDate(item.date)}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleExpand(itemKey)}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          {isExpanded ? 'Hide' : 'View'}
                                        </Button>
                                        
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(item.type, item.month)}
                                          className={confirmDelete === itemKey ? 'text-red-600' : ''}
                                        >
                                          <Trash className="w-4 h-4" />
                                          {confirmDelete === itemKey ? 'Confirm?' : ''}
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                  
                                  {/* Expanded Data Preview */}
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={4} className="p-0">
                                        <div className="bg-slate-50 p-4 rounded-lg my-2">
                                          <div className="flex justify-between mb-2">
                                            <h4 className="font-semibold">Data Preview</h4>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setExpandedItem(null)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                          
                                          <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                            {fileData && fileData.raw && fileData.raw.length > 0 ? (
                                              <>
                                                <table className="w-full border-collapse text-sm">
                                                  <thead>
                                                    <tr className="bg-slate-100">
                                                      {Object.keys(fileData.raw[0]).map((header, idx) => (
                                                        <th key={idx} className="p-2 text-left border-b font-medium">{header}</th>
                                                      ))}
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {fileData.raw.slice(0, 10).map((row, rowIdx) => (
                                                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                        {Object.values(row).map((cell, cellIdx) => (
                                                          <td key={cellIdx} className="p-2 border-b">{String(cell)}</td>
                                                        ))}
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                                
                                                {fileData.raw.length > 10 && (
                                                  <div className="mt-2 text-sm text-neutral-500 text-center">
                                                    Showing 10 of {fileData.raw.length} rows. Visit the Monthly view to see full analysis.
                                                  </div>
                                                )}
                                              </>
                                            ) : (
                                              <div className="text-center py-4 text-neutral-500">
                                                No data available for preview.
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="data" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Data</CardTitle>
                  <CardDescription>
                    View all uploaded data organized by type and month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(groupedHistory).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No data available to display</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Annual data section */}
                      {annualData && annualData.length > 0 && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Annual Data</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-200">
                                <tr>
                                  {Object.keys(annualData[0]).map((key, idx) => (
                                    <th key={idx} className="py-2 px-3 text-left font-medium">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {annualData.map((row, rowIdx) => (
                                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    {Object.entries(row).map(([key, value], cellIdx) => (
                                      <td key={cellIdx} className="py-2 px-3 border-b border-slate-200">
                                        {String(value)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Monthly data sections */}
                      {Object.keys(monthlyData).map(month => (
                        <div key={month}>
                          <h3 className="font-medium text-lg mb-2 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {month.charAt(0).toUpperCase() + month.slice(1)} Data
                          </h3>
                          
                          {/* E-type monthly data */}
                          {monthlyData[month]?.e && monthlyData[month].e.lineItems && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-neutral-600 mb-2">
                                Monthly Employee Data
                              </h4>
                              
                              <div className="overflow-x-auto mb-4">
                                {/* Table for entity data if available */}
                                {monthlyData[month].e.meta && monthlyData[month].e.meta.entityColumns && (
                                  <table className="w-full text-sm mb-4">
                                    <thead className="bg-slate-100">
                                      <tr>
                                        <th className="py-2 px-3 text-left font-medium">Line Item</th>
                                        {monthlyData[month].e.meta.entityColumns.map((header: string) => (
                                          <th key={header} className="py-2 px-3 text-left font-medium">{header}</th>
                                        ))}
                                        {monthlyData[month].e.meta.summaryColumn && (
                                          <th className="py-2 px-3 text-left font-medium">{monthlyData[month].e.meta.summaryColumn}</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {monthlyData[month].e.lineItems.map((item: any, index: number) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                          <td className="py-2 px-3 border-b font-medium" style={{ paddingLeft: `${(item.depth || 0) * 15 + 12}px` }}>
                                            {item.name}
                                          </td>
                                          {monthlyData[month].e.meta.entityColumns.map((header: string) => (
                                            <td key={header} className="py-2 px-3 border-b">
                                              {item.values[header] !== undefined ? formatCurrency(item.values[header]) : '-'}
                                            </td>
                                          ))}
                                          {monthlyData[month].e.meta.summaryColumn && (
                                            <td className="py-2 px-3 border-b font-medium">
                                              {item.values[monthlyData[month].e.meta.summaryColumn] !== undefined
                                                ? formatCurrency(item.values[monthlyData[month].e.meta.summaryColumn])
                                                : '-'}
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* O-type monthly data */}
                          {monthlyData[month]?.o && monthlyData[month].o.lineItems && (
                            <div>
                              <h4 className="text-sm font-medium text-neutral-600 mb-2">
                                Monthly Business Data
                              </h4>
                              
                              <div className="overflow-x-auto">
                                {/* Table for entity data if available */}
                                {monthlyData[month].o.meta && monthlyData[month].o.meta.entityColumns && (
                                  <table className="w-full text-sm mb-4">
                                    <thead className="bg-slate-100">
                                      <tr>
                                        <th className="py-2 px-3 text-left font-medium">Line Item</th>
                                        {monthlyData[month].o.meta.entityColumns.map((header: string) => (
                                          <th key={header} className="py-2 px-3 text-left font-medium">{header}</th>
                                        ))}
                                        {monthlyData[month].o.meta.summaryColumn && (
                                          <th className="py-2 px-3 text-left font-medium">{monthlyData[month].o.meta.summaryColumn}</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {monthlyData[month].o.lineItems.map((item: any, index: number) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                          <td className="py-2 px-3 border-b font-medium" style={{ paddingLeft: `${(item.depth || 0) * 15 + 12}px` }}>
                                            {item.name}
                                          </td>
                                          {monthlyData[month].o.meta.entityColumns.map((header: string) => (
                                            <td key={header} className="py-2 px-3 border-b">
                                              {item.values[header] !== undefined ? formatCurrency(item.values[header]) : '-'}
                                            </td>
                                          ))}
                                          {monthlyData[month].o.meta.summaryColumn && (
                                            <td className="py-2 px-3 border-b font-medium">
                                              {item.values[monthlyData[month].o.meta.summaryColumn] !== undefined
                                                ? formatCurrency(item.values[monthlyData[month].o.meta.summaryColumn])
                                                : '-'}
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}