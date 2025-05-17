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
  const { setUploadsFromServer } = useStore();
  
  // Fetch upload history from server
  const { data: uploadData, isSuccess } = useQuery({
    queryKey: ['/api/uploads'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  useEffect(() => {
    if (isSuccess && uploadData) {
      console.log("Loading data from server:", uploadData.length, "uploads");
      setUploadsFromServer(uploadData);
    }
  }, [isSuccess, uploadData, setUploadsFromServer]);
  
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
