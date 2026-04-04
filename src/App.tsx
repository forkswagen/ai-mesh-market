import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SolanaWalletProvider } from "@/contexts/SolanaWalletContext";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import DatasetsPage from "./pages/DatasetsPage";
import ComputePage from "./pages/ComputePage";
import AgentsPage from "./pages/AgentsPage";
import EscrowPage from "./pages/EscrowPage";
import SettingsPage from "./pages/SettingsPage";
import LandingPage from "./pages/LandingPage";
import SolTolokaPage from "./pages/SolTolokaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/datasets" element={<DatasetsPage />} />
              <Route path="/compute" element={<ComputePage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/escrow" element={<EscrowPage />} />
              <Route path="/soltoloka" element={<SolTolokaPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
