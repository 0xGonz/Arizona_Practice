import React, { useEffect } from 'react';

// This component helps prevent React Fragment metadata warnings
// by properly initializing the React application
export default function AppRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Remove any data-replit-metadata attributes that might be
    // added by the Replit environment
    const cleanupMetadata = () => {
      document.querySelectorAll('[data-replit-metadata]').forEach(el => {
        el.removeAttribute('data-replit-metadata');
      });
    };
    
    // Run cleanup on mount
    cleanupMetadata();
    
    // Optional: could also run on interval if needed
    // const interval = setInterval(cleanupMetadata, 1000);
    // return () => clearInterval(interval);
  }, []);
  
  return <>{children}</>;
}