import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Mobile Menu - Simplified version without separate component */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-3">
              <h1 className="text-xl font-semibold text-primary">Clinic Analytics</h1>
              <button 
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => setMobileNavOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="space-y-2">
              <a href="/" className="block p-2 rounded hover:bg-blue-50">Dashboard</a>
              <a href="/monthly" className="block p-2 rounded hover:bg-blue-50">Month by Month</a>
              <a href="/doctor-performance" className="block p-2 rounded hover:bg-blue-50">Doctor Performance</a>
              <a href="/department-analysis" className="block p-2 rounded hover:bg-blue-50">Department Analysis</a>
              <a href="/upload" className="block p-2 rounded hover:bg-blue-50">Upload Data</a>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleMobileNav} />
        <main className="flex-1 overflow-y-auto bg-[#F5F7FA]">
          {children}
        </main>
      </div>
    </div>
  );
}
