import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useOfflineQueue } from "@/context/OfflineQueueContext";
import { useToast } from "@/hooks/use-toast";

export function Layout({ children, title, showBack = true }: { children: React.ReactNode, title?: string, showBack?: boolean }) {
  const [location] = useLocation();
  const { queue, flushQueue, isFlushing } = useOfflineQueue();
  const { toast } = useToast();
  const [wasSent, setWasSent] = useState(false);

  const handleSend = async () => {
    const { sent, failed } = await flushQueue();
    if (sent > 0 && failed === 0) {
      toast({ title: "All data sent!", description: `${sent} submission${sent !== 1 ? "s" : ""} uploaded successfully.` });
      setWasSent(true);
      setTimeout(() => setWasSent(false), 3000);
    } else if (sent > 0 && failed > 0) {
      toast({ title: "Partially sent", description: `${sent} sent, ${failed} still pending. Try again when connected.`, variant: "destructive" });
    } else {
      toast({ title: "Still offline", description: "Could not reach the server. Data is still saved locally.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative z-0 overflow-x-hidden">
      <div
        className="fixed inset-0 z-[-1] opacity-20 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.png)` }}
      />

      {/* Send Data floating button — only visible when there's queued data */}
      {queue.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleSend}
            disabled={isFlushing}
            className="h-14 px-5 rounded-full shadow-[0_0_20px_rgba(230,0,0,0.5)] bg-primary hover:bg-primary/90 text-white font-semibold gap-2 text-base"
          >
            {isFlushing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Send Data
            <span className="ml-1 bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {queue.length}
            </span>
          </Button>
        </div>
      )}

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
