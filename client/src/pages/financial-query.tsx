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
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
  category: z.string().optional(),
  lineItemPattern: z.string().optional(),
  entityNames: z.string().optional(),
  minDepth: z.string().optional(),
  maxDepth: z.string().optional(),
  fileType: z.enum(['annual', 'monthly-e', 'monthly-o']).optional(),
  limit: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function FinancialQueryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: '',
      year: '',
      category: '',
      lineItemPattern: '',
      entityNames: '',
      minDepth: '',
      maxDepth: '',
      fileType: undefined,
      limit: '100'
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
      // Apply the same filters as the query
      return apiRequest('/api/finance/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...queryParams,
          // If we have specific IDs selected, use those instead
          // lineItemIds: selectedItems.map(item => item.id)
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
    const filteredParams: Record<string, string> = {};
    
    Object.entries(values).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        filteredParams[key] = value;
      }
    });
    
    setQueryParams(filteredParams);
    setHasQueried(true);
  };
  
  const handleDelete = () => {
    deleteData();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Financial Data Query Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Query Parameters</CardTitle>
            <CardDescription>
              Filter financial data across multiple dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., january" {...field} />
                      </FormControl>
                      <FormDescription>
                        Filter by specific month (case-sensitive)
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2025" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Revenue" {...field} />
                      </FormControl>
                      <FormDescription>
                        Top-level financial category
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lineItemPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Line Item Pattern</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Salary" {...field} />
                      </FormControl>
                      <FormDescription>
                        Searches line item text (partial match)
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="entityNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity Names</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dr. Smith,Dr. Jones" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of entity names
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minDepth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Depth</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 0" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxDepth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Depth</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="fileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select file type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="monthly-e">Monthly Employee (E)</SelectItem>
                          <SelectItem value="monthly-o">Monthly Other (O)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result Limit</FormLabel>
                      <FormControl>
                        <Input placeholder="100" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Querying...
                    </>
                  ) : (
                    'Execute Query'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
            <CardDescription>
              {data?.count ? `Found ${data.count} results` : 'No results yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                <h3 className="font-semibold">Error executing query</h3>
                <p className="text-sm">{(error as Error).message || 'Unknown error'}</p>
              </div>
            ) : !data ? (
              <div className="text-center text-muted-foreground h-64 flex flex-col justify-center">
                <p>Use the form to query financial data</p>
                <p className="text-sm mt-2">Tip: Try searching by month or category first</p>
              </div>
            ) : data.results?.length === 0 ? (
              <div className="text-center text-muted-foreground h-64 flex flex-col justify-center">
                <p>No results found for this query</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Depth</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {data.results.map((item: any) => (
                        <tr key={item.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div style={{ paddingLeft: `${item.depth * 1}rem` }}>
                              {item.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{item.categoryName || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                              item.rowType === 'header' ? 'bg-blue-100 text-blue-800' : 
                              item.rowType === 'total' ? 'bg-purple-100 text-purple-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.rowType}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{item.depth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {data.results.some((item: any) => item.values?.length > 0) && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-lg font-semibold mb-4">Financial Values</h3>
                    <div className="space-y-4">
                      {data.results.filter((item: any) => item.values?.length > 0).map((item: any) => (
                        <Card key={`values-${item.id}`}>
                          <CardHeader className="py-2">
                            <CardTitle className="text-base">{item.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <table className="min-w-full divide-y divide-border">
                              <thead>
                                <tr>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entity</th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Value</th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Month</th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.values.map((value: any, index: number) => (
                                  <tr key={index} className="hover:bg-muted/50">
                                    <td className="px-2 py-1">{value.entityName}</td>
                                    <td className="px-2 py-1">{value.numericValue?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                    <td className="px-2 py-1">{value.month || 'N/A'}</td>
                                    <td className="px-2 py-1">{value.year}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}