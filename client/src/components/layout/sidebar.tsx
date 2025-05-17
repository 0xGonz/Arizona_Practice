import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Upload, 
  History, 
  Stethoscope,
  User,
  Building,
  LineChart
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navigationItems: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: "Monthly Analytics", path: "/", icon: <CalendarDays className="w-5 h-5" /> }
    ]
  },
  {
    section: "Analysis",
    items: [
      { name: "Financial Analysis", path: "/financial-analysis", icon: <LineChart className="w-5 h-5" /> }
    ]
  },
  {
    section: "Data Management",
    items: [
      { name: "Upload Data", path: "/upload", icon: <Upload className="w-5 h-5" /> },
      { name: "Upload History", path: "/upload-history", icon: <History className="w-5 h-5" /> }
    ]
  }
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="bg-white w-64 border-r border-neutral-border h-full flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-neutral-border">
        <h1 className="text-xl font-semibold text-primary flex items-center">
          <Stethoscope className="w-6 h-6 mr-2 text-primary" />
          Clinic Analytics
        </h1>
      </div>
      
      <nav className="p-2">
        {navigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="text-xs uppercase text-neutral-text font-semibold px-3 pt-4 pb-2">
              {section.section}
            </div>
            
            {section.items.map((item, itemIndex) => {
              const isActive = location === item.path;
              return (
                <Link 
                  key={itemIndex} 
                  href={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg mb-1 ${
                    isActive 
                      ? "text-primary bg-blue-50" 
                      : "text-neutral-dark hover:bg-blue-50"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
