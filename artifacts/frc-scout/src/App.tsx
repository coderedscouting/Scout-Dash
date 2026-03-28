import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { OfflineQueueProvider } from "@/context/OfflineQueueContext";

import Home from "@/pages/Home";
import MatchScout from "@/pages/MatchScout";
import PitScout from "@/pages/PitScout";
import HpScout from "@/pages/HpScout";
import DataViewer from "@/pages/DataViewer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/match" component={MatchScout} />
      <Route path="/pit" component={PitScout} />
      <Route path="/humanplayer" component={HpScout} />
      <Route path="/data" component={DataViewer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineQueueProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </OfflineQueueProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
