import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building } from 'lucide-react';
import EmployeeAnalysis from './employee-analysis';
import BusinessAnalysis from './business-analysis';

export default function FinancialAnalysis() {
  const [location, navigate] = useLocation();
  
  // Default state to track which tab is active
  const [activeTab, setActiveTab] = useState<'employee' | 'business'>('employee');
  
  // Handle tab selection
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'employee' | 'business');
  };
  
  return (
    <div className="container p-6">
      <Helmet>
        <title>Financial Analysis - Clinic Financial Dashboard</title>
        <meta name="description" content="Analyze financial performance of providers and business lines with interactive charts and filters" />
      </Helmet>
      
      <div className="flex flex-col space-y-1.5 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Financial Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Analyze performance metrics for employees and business departments
        </p>
      </div>
      
      {/* Main tabs navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Employee Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Business Analysis</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Tab content (using wrapper components to avoid duplicate UI elements) */}
        <div className="mt-4">
          {activeTab === 'employee' ? (
            <EmployeeAnalysisContent />
          ) : (
            <BusinessAnalysisContent />
          )}
        </div>
      </Tabs>
    </div>
  );
}