import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, FileSpreadsheet, Loader2, Search, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

// Simplified form schema with only the most essential fields
const formSchema = z.object({
  month: z.string().optional(),
  fileType: z.enum(['annual', 'monthly-e', 'monthly-o']).optional(),
  keyword: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function FinancialQueryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("search");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: '',
      fileType: undefined,
      keyword: ''
    }
  });

  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [hasQueried, setHasQueried] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/finance/query', queryParams],
    queryFn: async () => {
      if (!hasQueried) return null;
      
      const queryString = new URLSearchParams(queryParams).toString();
      return apiRequest<any>(`/api/finance/query?${queryString}`);
    },
    enabled: hasQueried,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Delete mutation
  const { mutate: deleteData, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/finance/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...queryParams
        }),
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Data deleted successfully",
        description: `Removed ${response.deletedCount} financial data entries`,
      });
      
      // Refresh all queries
      queryClient.invalidateQueries();
      setHasQueried(false);
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: FormValues) => {
    // Convert form values to query parameters
    const params: Record<string, string> = {};
    
    if (values.month && values.month.trim() !== '') {
      params.month = values.month.toLowerCase();
    }
    
    if (values.fileType) {
      params.fileType = values.fileType;
    }
    
    if (values.keyword && values.keyword.trim() !== '') {
      params.lineItemPattern = values.keyword;
    }
    
    setQueryParams(params);
    setHasQueried(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  // Format currency values for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark mb-1">Financial Data Explorer</h1>
          <p className="text-neutral-text">Search, view, and manage financial data across your business</p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Link href="/monthly-improved">
            <Button variant="outline" className="bg-white">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Monthly View
            </Button>
          </Link>
          <Link href="/upload">
            <Button>Upload New Data</Button>
          </Link>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="search">Quick Search</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Financial Data</CardTitle>
              <CardDescription>
                Find specific financial information across your business data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="january">January</SelectItem>
                              <SelectItem value="february">February</SelectItem>
                              <SelectItem value="march">March</SelectItem>
                              <SelectItem value="april">April</SelectItem>
                              <SelectItem value="may">May</SelectItem>
                              <SelectItem value="june">June</SelectItem>
                              <SelectItem value="july">July</SelectItem>
                              <SelectItem value="august">August</SelectItem>
                              <SelectItem value="september">September</SelectItem>
                              <SelectItem value="october">October</SelectItem>
                              <SelectItem value="november">November</SelectItem>
                              <SelectItem value="december">December</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Filter by specific month
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fileType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select data type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="annual">Annual Data</SelectItem>
                              <SelectItem value="monthly-e">Employee Data</SelectItem>
                              <SelectItem value="monthly-o">Business Data</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the type of financial data
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="keyword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Search Keyword</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., salary, revenue, etc." 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Search across all line items
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Search Data
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {hasQueried && data && (
            <div className="mt-6">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Search Results</CardTitle>
                    <CardDescription>
                      {data.count} results found
                    </CardDescription>
                  </div>
                  
                  {data.count > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("results")}
                    >
                      View Full Results
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {data.count > 0 ? (
                    <div>
                      <p className="mb-4">Top matches from your search:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.results.slice(0, 4).map((item: any) => (
                          <Card key={item.id} className="bg-muted/20">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium">{item.name}</h3>
                                <Badge variant="outline">
                                  {item.categoryName || 'Uncategorized'}
                                </Badge>
                              </div>
                              
                              {item.values && Object.entries(item.values).length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {Object.entries(item.values).slice(0, 3).map(([entity, value]: [string, any]) => (
                                    <div key={entity} className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">{entity}</span>
                                      <span className="font-medium">
                                        {formatCurrency(Number(value))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No results match your search criteria.</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms or selecting a different month/data type.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="results">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Full Results</CardTitle>
                {data && <CardDescription>{data.count} items found</CardDescription>}
              </div>
              
              {data && data.count > 0 && (
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Results
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {error && (
                <div className="flex items-center p-4 mb-4 text-red-800 bg-red-50 rounded-md">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium">Error running query</h3>
                    <p className="text-xs mt-1">{String(error)}</p>
                  </div>
                </div>
              )}
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : data && data.results ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="p-3 text-left font-medium">Line Item</th>
                        <th className="p-3 text-center font-medium">Category</th>
                        <th className="p-3 text-right font-medium">Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.results.length > 0 ? (
                        data.results.map((item: any) => (
                          <tr key={item.id} className="border-b hover:bg-muted/20">
                            <td className="p-3 font-medium" style={{ paddingLeft: `${(item.depth || 0) * 20 + 12}px` }}>
                              {item.name}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline">
                                {item.categoryName || 'Uncategorized'}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              {item.values && Object.entries(item.values).length > 0 ? (
                                <div className="flex flex-col items-end">
                                  {Object.entries(item.values).map(([entity, value]: [string, any]) => (
                                    <div key={entity} className="text-sm">
                                      <span className="text-muted-foreground mr-2">{entity}:</span>
                                      <span className="font-medium">{formatCurrency(Number(value))}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No values</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-muted-foreground">
                            No results match your query. Try adjusting your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">Enter search parameters on the Quick Search tab and click "Search Data".</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all financial data matching your current search criteria.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteData()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}