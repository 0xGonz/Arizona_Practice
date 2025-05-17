import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Monthly from "@/pages/monthly-improved";
import DoctorPerformance from "@/pages/doctor-performance";
import DepartmentAnalysis from "@/pages/department-analysis";
import Upload from "@/pages/upload";
import UploadHistory from "@/pages/upload-history";
import FinancialQuery from "@/pages/financial-query";
import NotFound from "@/pages/not-found";
import { useStore } from "@/store/data-store";
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
      
      // Find the most recent uploads of each type to load their data
      const loadMostRecentData = async () => {
        try {
          // Get most recent annual upload
          const annualUploads = uploadData.filter((u: any) => u.type === 'annual')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Get most recent monthly uploads by month
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
          
          // Load annual data if available
          if (annualUploads.length > 0) {
            const latestAnnual = annualUploads[0];
            console.log(`Loading annual data from upload ID ${latestAnnual.id}`);
            await loadCSVContent(latestAnnual.id);
          }
          
          // Load ALL months to ensure complete data visibility
          const monthKeys = Object.keys(monthlyByMonth);
          console.log("Available months in uploads:", monthKeys.join(", "));
          
          for (const month of monthKeys) {
            const monthUploads = monthlyByMonth[month];
            
            // Load E-type upload for this month if available
            const eUpload = monthUploads.find((u: any) => u.type === 'monthly-e');
            if (eUpload) {
              console.log(`Loading monthly-e data for ${month} from upload ID ${eUpload.id}`);
              try {
                await loadCSVContent(eUpload.id);
              } catch (e) {
                console.error(`Error loading monthly-e data for ${month}:`, e);
              }
            }
            
            // Load O-type upload for this month if available
            const oUpload = monthUploads.find((u: any) => u.type === 'monthly-o');
            if (oUpload) {
              console.log(`Loading monthly-o data for ${month} from upload ID ${oUpload.id}`);
              try {
                await loadCSVContent(oUpload.id);
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
        <Route path="/" component={Dashboard} />
        <Route path="/monthly" component={Monthly} />
        <Route path="/doctor-performance" component={DoctorPerformance} />
        <Route path="/department-analysis" component={DepartmentAnalysis} />
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
