import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider } from "./features/auth/hooks/useAuth";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { Login } from "./features/auth/components/Login";
import DashboardLayout from "./components/Layout/DashboardLayout";
import ManagerLayout from "./components/Layout/ManagerLayout";
import TvLayout from "./components/Layout/TvLayout";
import Index from "./pages/Index";
import ManagerDashboard from "./pages/ManagerDashboard";
import Crm from "./pages/Crm";
import Gerentes from "./pages/Gerentes";
import Config from "./pages/Config";
import Relatorios from "./pages/Relatorios";
import Presentation from "./pages/Presentation";
import TvOperacional from "./pages/tv/TvOperacional";
import TvDashboard from "./components/Dashboard/TvDashboard";
import NotFound from "./pages/NotFound";
import { useAppData } from "./context/AppDataContext";
import { useAuth } from "./features/auth/hooks/useAuth";

const queryClient = new QueryClient();

// Inner app that can access auth+data context for routing decisions
const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const { managers } = useAppData();
  const isUnitManager = managers.some(m => m.auth_user_id === user?.id);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Unit Manager Routes */}
      {isUnitManager ? (
        <Route element={<ProtectedRoute />}>
          <Route element={<ManagerLayout />}>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="*" element={<ManagerDashboard />} />
          </Route>
        </Route>
      ) : (
        /* Admin Routes */
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/crm" element={<Crm />} />
            <Route path="/gerentes" element={<Gerentes />} />
            <Route path="/config" element={<Config />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/apresentacao" element={<Presentation />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* TV Routes (admin only) */}
          <Route element={<TvLayout />}>
            <Route path="/tv/operacional" element={<TvOperacional />} />
            <Route path="/tv/executivo" element={<TvDashboard />} />
          </Route>
        </Route>
      )}
    </Routes>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppDataProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AppDataProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
