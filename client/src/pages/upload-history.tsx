import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Trash, FileSpreadsheet, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function UploadHistory() {
  const { uploadHistory, uploadStatus, clearUploadedData } = useStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
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
    } else {
      // Ask for confirmation
      setConfirmDelete(deleteKey);
    }
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
                      {groupedHistory['annual'].map((item, index) => (
                        <tr key={index} className="border-b">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.type)}
                              className={confirmDelete === `${item.type}-annual` ? 'text-red-600' : ''}
                            >
                              <Trash className="w-4 h-4" />
                              {confirmDelete === `${item.type}-annual` ? 'Confirm?' : ''}
                            </Button>
                          </td>
                        </tr>
                      ))}
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
                        {groupedHistory[month].map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">
                              {getTypeDisplay(item.type)}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.type, item.month)}
                                className={confirmDelete === `${item.type}-${item.month}` ? 'text-red-600' : ''}
                              >
                                <Trash className="w-4 h-4" />
                                {confirmDelete === `${item.type}-${item.month}` ? 'Confirm?' : ''}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}