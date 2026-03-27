import React from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children, title, showBack = true }: { children: React.ReactNode, title?: string, showBack?: boolean }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative z-0 overflow-x-hidden">
      <div
        className="fixed inset-0 z-[-1] opacity-20 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.png)` }}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {showBack && location !== "/" && (
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 -ml-2">
                <ChevronLeft className="h-5 w-5 mr-1" /> Back
              </Button>
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
