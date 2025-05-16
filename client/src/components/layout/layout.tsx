import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileSidebar from "./mobile-sidebar";

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

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

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
