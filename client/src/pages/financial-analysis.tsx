import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, Switch, Route } from 'wouter';
import { cn } from '@/lib/utils';
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
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Financial Analysis - Clinic Financial Dashboard</title>
        <meta name="description" content="Analyze financial performance of providers and business lines with interactive charts and filters" />
      </Helmet>
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Financial Analysis</h1>
      </div>
      
      {/* Main tabs navigation */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="employee" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Employee Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Business Analysis</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Display the selected analysis view */}
      <div className="mt-4">
        {activeTab === 'employee' ? (
          <EmployeeAnalysis />
        ) : (
          <BusinessAnalysis />
        )}
      </div>
    </div>
  );
}