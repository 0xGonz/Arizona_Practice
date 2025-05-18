import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Upload, 
  History, 
  Stethoscope,
  Menu,
  BarChart2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navigationItems = [
  { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { name: "Monthly Analytics", path: "/", icon: <CalendarDays className="w-4 h-4" /> },
  { name: "Deep Analysis", path: "/deep-analysis", icon: <BarChart2 className="w-4 h-4" /> },
  { name: "Upload Data", path: "/upload", icon: <Upload className="w-4 h-4" /> },
  { name: "New Upload", path: "/upload-new", icon: <Upload className="w-4 h-4" /> },
  { name: "Upload History", path: "/upload-history", icon: <History className="w-4 h-4" /> }
];

export default function TopNav() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex items-center px-4 py-2 bg-white border-b">
        <div className="flex items-center space-x-2 mr-4">
          <Stethoscope className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-primary hidden sm:block">Clinic Analytics</h1>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center flex-1 overflow-x-auto">
          {navigationItems.map((item, index) => {
            const isActive = location === item.path || 
              (item.path === "/" && location === "/monthly");
              
            return (
              <Link 
                key={index} 
                href={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-gray-600 hover:text-primary hover:bg-blue-50 rounded"
                )}
              >
                <span className="mr-1">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden ml-auto p-2 rounded-md hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-sm">
          <nav className="flex flex-col">
            {navigationItems.map((item, index) => {
              const isActive = location === item.path || 
                (item.path === "/" && location === "/monthly");
                
              return (
                <Link 
                  key={index} 
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium transition-colors",
                    isActive 
                      ? "text-primary bg-blue-50" 
                      : "text-gray-600 hover:text-primary hover:bg-blue-50"
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}