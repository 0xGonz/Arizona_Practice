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
import NotFound from "@/pages/not-found";

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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
