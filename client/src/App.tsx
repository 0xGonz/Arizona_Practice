import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Monthly from "@/pages/monthly-improved";
import Upload from "@/pages/upload";
import UploadHistory from "@/pages/upload-history";
import FinancialQuery from "@/pages/financial-query";
import NotFound from "@/pages/not-found";
import { useStore } from "@/store/simplified-store";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// This component will fetch data from server before rendering the app
function DataInitializer({ children }: { children: React.ReactNode }) {
  const { setUploadsFromServer, processCSVData, loadCSVContent } = useStore();
  
  // Fetch upload history from server
  const { data: uploadData, isSuccess } = useQuery({
    queryKey: ['/api/uploads'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // First load upload metadata
  useEffect(() => {
    if (isSuccess && uploadData) {
      console.log("Loading data from server:", uploadData.length, "uploads");
      setUploadsFromServer(uploadData);
      
      // Find the most recent uploads to load their data
      const loadMostRecentData = async () => {
        try {
          // Get monthly uploads only - no annual data
          const monthlyUploads = uploadData.filter((u: any) => 
            u.type === 'monthly-e' || u.type === 'monthly-o'
          );
          
          // Group monthly uploads by month
          const monthlyByMonth: Record<string, any[]> = {};
          monthlyUploads.forEach((upload: any) => {
            if (upload.month) {
              const cleanMonth = upload.month.toLowerCase().trim();
              if (!monthlyByMonth[cleanMonth]) {
                monthlyByMonth[cleanMonth] = [];
              }
              monthlyByMonth[cleanMonth].push(upload);
            }
          });
          
          // Load ALL months to ensure complete data visibility
          const monthKeys = Object.keys(monthlyByMonth);
          console.log("Available months in uploads:", monthKeys.join(", "));
          
          for (const month of monthKeys) {
            const monthUploads = monthlyByMonth[month];
            
            // Load E-type upload for this month if available - use the most recent one
            // Sort by ID in descending order to get the most recent upload first
            const eUploads = monthUploads
              .filter((u: any) => u.type === 'monthly-e')
              .sort((a: any, b: any) => b.id - a.id);
              
            const eUpload = eUploads.length > 0 ? eUploads[0] : null;
            if (eUpload) {
              console.log(`Loading monthly-e data for ${month} from upload ID ${eUpload.id} (most recent of ${eUploads.length})`);
              try {
                const csvData = await loadCSVContent(eUpload.id);
                if (csvData && Array.isArray(csvData)) {
                  // Process the loaded data and update the store with it
                  console.log(`Processing ${csvData.length} rows of monthly-e data for ${month}`);
                  processCSVData('monthly-e', csvData, month);
                }
              } catch (e) {
                console.error(`Error loading monthly-e data for ${month}:`, e);
              }
            }
            
            // Load O-type upload for this month if available - use the most recent one
            // Sort by ID in descending order to get the most recent upload first
            const oUploads = monthUploads
              .filter((u: any) => u.type === 'monthly-o')
              .sort((a: any, b: any) => b.id - a.id);
              
            const oUpload = oUploads.length > 0 ? oUploads[0] : null;
            if (oUpload) {
              console.log(`Loading monthly-o data for ${month} from upload ID ${oUpload.id} (most recent of ${oUploads.length})`);
              try {
                const csvData = await loadCSVContent(oUpload.id);
                if (csvData && Array.isArray(csvData)) {
                  // Process the loaded data and update the store with it
                  console.log(`Processing ${csvData.length} rows of monthly-o data for ${month}`);
                  processCSVData('monthly-o', csvData, month);
                }
              } catch (e) {
                console.error(`Error loading monthly-o data for ${month}:`, e);
              }
            }
          }
          
          console.log("Completed initial data load from server");
          
        } catch (error) {
          console.error("Error loading initial data:", error);
        }
      };
      
      // Start loading the actual data
      loadMostRecentData();
    }
  }, [isSuccess, uploadData, setUploadsFromServer, loadCSVContent]);
  
  return <>{children}</>;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Monthly} />
        <Route path="/monthly" component={Monthly} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/upload" component={Upload} />
        <Route path="/upload-history" component={UploadHistory} />
        <Route path="/financial-query" component={FinancialQuery} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <DataInitializer>
          <Router />
        </DataInitializer>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
