import { useEffect } from "react";
import { useLocation } from "wouter";

// Redirect from dashboard page to monthly page
export default function Dashboard() {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to monthly page on component mount
    setLocation("/monthly");
  }, [setLocation]);
  
  // Return empty div, it will never be shown since we redirect immediately
  return <div></div>;
}