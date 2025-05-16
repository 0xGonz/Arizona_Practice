import { useState } from "react";
import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Header() {
  return (
    <header className="bg-white border-b border-neutral-border py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <button className="md:hidden mr-4">
          <Menu />
        </button>
        <h2 className="text-xl font-semibold">Financial Dashboard</h2>
      </div>
      
      <div className="flex items-center">
        <div className="relative mr-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-text" />
          <Input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2"
          />
        </div>
        
        <div className="border-r border-neutral-border h-8 mx-2"></div>
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <HelpCircle className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" className="ml-3 rounded-full bg-neutral-bg p-1">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="material-icons text-sm">person</span>
          </div>
        </Button>
      </div>
    </header>
  );
}
