import React from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Menu } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children, title, showBack = true }: { children: React.ReactNode, title?: string, showBack?: boolean }) {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col relative z-0">
      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 z-[-1] opacity-20 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.png)` }}
      />
      
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 rounded-none border-x-0 border-t-0">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBack && location !== "/" && (
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-white/5">
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-3">
              <img 
                src={`${import.meta.env.BASE_URL}images/logo.png`} 
                alt="Code Red 2771 Logo" 
                className="h-8 w-8 object-contain rounded-sm"
              />
              <span className="font-display font-bold text-xl tracking-wider text-white">
                {title || "CODE RED SCOUT"}
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/match" className="px-4 py-2 text-sm font-semibold hover:text-primary transition-colors">Match Scout</Link>
            <Link href="/pit" className="px-4 py-2 text-sm font-semibold hover:text-primary transition-colors">Pit Scout</Link>
            <Link href="/humanplayer" className="px-4 py-2 text-sm font-semibold hover:text-primary transition-colors">HP Scout</Link>
            <Link href="/data" className="px-4 py-2 text-sm font-semibold hover:text-primary transition-colors">Data View</Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
