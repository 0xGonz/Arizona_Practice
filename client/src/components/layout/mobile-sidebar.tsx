import { 
  X, 
  LayoutDashboard, 
  CalendarDays, 
  User, 
  Building, 
  Upload, 
  History, 
  FileText, 
  LineChart, 
  Stethoscope 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", path: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: "Month by Month", path: "/monthly", icon: <CalendarDays className="w-5 h-5" /> },
      { name: "Doctor Performance", path: "/doctor-performance", icon: <User className="w-5 h-5" /> },
      { name: "Department Analysis", path: "/department-analysis", icon: <Building className="w-5 h-5" /> }
    ]
  },
  {
    section: "Data Management",
    items: [
      { name: "Upload Data", path: "/upload", icon: <Upload className="w-5 h-5" /> },
      { name: "Upload History", path: "/upload?tab=history", icon: <History className="w-5 h-5" /> }
    ]
  },
  {
    section: "Reports",
    items: [
      { name: "Generate Reports", path: "/reports", icon: <FileText className="w-5 h-5" /> },
      { name: "Financial Insights", path: "/insights", icon: <LineChart className="w-5 h-5" /> }
    ]
  }
];

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const [location] = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-neutral-border">
          <h1 className="text-xl font-semibold text-primary flex items-center">
            <Stethoscope className="w-6 h-6 mr-2 text-primary" />
            Clinic Analytics
          </h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="p-4">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-4">
              <div className="text-xs uppercase text-neutral-text font-semibold px-3 pt-2 pb-2">
                {section.section}
              </div>
              
              {section.items.map((item, itemIndex) => {
                const isActive = location === item.path;
                return (
                  <Link 
                    key={itemIndex} 
                    href={item.path}
                    className={`flex items-center px-3 py-3 rounded-lg mb-1 ${
                      isActive 
                        ? "text-primary bg-blue-50" 
                        : "text-neutral-dark hover:bg-blue-50"
                    }`}
                    onClick={onClose}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}