import React from 'react';
import { Link, useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building } from 'lucide-react';

export function AnalysisTabs() {
  const [location] = useLocation();
  const activeTab = location.includes('employee') ? 'employee' : 'business';

  return (
    <div className="mb-6">
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <Link href="/employee-analysis">
            <TabsTrigger value="employee" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Employee Analysis</span>
            </TabsTrigger>
          </Link>
          <Link href="/business-analysis">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>Business Analysis</span>
            </TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>
    </div>
  );
}