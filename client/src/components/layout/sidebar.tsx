import { useState } from "react";
import { Link, useLocation } from "wouter";

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

const navigationItems: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", path: "/", icon: "dashboard" },
      { name: "Month by Month", path: "/monthly", icon: "calendar_month" },
      { name: "Doctor Performance", path: "/doctor-performance", icon: "person" },
      { name: "Department Analysis", path: "/department-analysis", icon: "business" }
    ]
  },
  {
    section: "Data Management",
    items: [
      { name: "Upload Data", path: "/upload", icon: "upload_file" },
      { name: "Upload History", path: "/upload?tab=history", icon: "history" }
    ]
  },
  {
    section: "Reports",
    items: [
      { name: "Generate Reports", path: "/reports", icon: "summarize" },
      { name: "Financial Insights", path: "/insights", icon: "insights" }
    ]
  }
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="bg-white w-64 border-r border-neutral-border h-full flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-neutral-border">
        <h1 className="text-xl font-semibold text-primary flex items-center">
          <span className="material-icons mr-2">medical_services</span>
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
                  <span className="material-icons mr-2">{item.icon}</span>
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
