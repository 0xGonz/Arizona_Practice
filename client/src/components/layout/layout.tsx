import { ReactNode, useState } from "react";
import TopNav from "./top-nav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto bg-[#F5F7FA] px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
