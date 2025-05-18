import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/working-store";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface LoadDataButtonProps {
  uploadId: number | undefined;
  type: string;
  month?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LoadDataButton({ 
  uploadId, 
  type, 
  month, 
  className = '',
  variant = "default",
  size = "sm"
}: LoadDataButtonProps) {
  const { loadCSVContent } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const handleLoad = async () => {
    if (!uploadId) return;
    
    try {
      setLoading(true);
      
      console.log(`Attempting to load CSV content for ID: ${uploadId}`);
      // Load the CSV content from database
      const result = await loadCSVContent(uploadId);
      
      if (result) {
        toast({
          title: "Data loaded successfully",
          description: `${getTypeDisplay(type)} has been loaded from the database.`,
        });
        
        // Redirect to the appropriate page based on type
        if (type === 'annual') {
          window.location.href = '/';
        } else if (type.startsWith('monthly') && month) {
          window.location.href = `/monthly?month=${month}`;
        }
      } else {
        toast({
          title: "Error loading data",
          description: "No data was returned from the server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading CSV content:", error);
      toast({
        title: "Error loading data",
        description: "There was a problem loading the data from the server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      className={className}
      variant={variant}
      size={size}
      onClick={handleLoad}
      disabled={loading || !uploadId}
    >
      <Download className="w-4 h-4 mr-1" />
      {loading ? 'Loading...' : 'Load Data'}
    </Button>
  );
}