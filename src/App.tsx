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
import AuditHistory from "./pages/AuditHistory";
import AuditoriaApp from "./pages/Auditoria";
import NotFound from "./pages/NotFound";
import { useAppData } from "./context/AppDataContext";
import { useAuth } from "./features/auth/hooks/useAuth";
import { BackgroundAuditorProvider } from "./context/BackgroundAuditorContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Inner app that can access auth+data context for routing decisions
const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const { managers, isLoading } = useAppData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-primary animate-spin mb-4" />
        <p className="text-white/50 text-sm font-semibold tracking-widest uppercase animate-pulse">Carregando Perfil...</p>
      </div>
    );
  }

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
            <Route path="/historico-auditorias" element={<ErrorBoundary><AuditHistory /></ErrorBoundary>} />
            <Route path="*" element={<ManagerDashboard />} />
          </Route>
        </Route>
      ) : (
        /* Admin Routes */
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
            <Route path="/crm" element={<ErrorBoundary><Crm /></ErrorBoundary>} />
            <Route path="/gerentes" element={<ErrorBoundary><Gerentes /></ErrorBoundary>} />
            <Route path="/config" element={<ErrorBoundary><Config /></ErrorBoundary>} />
            <Route path="/relatorios" element={<ErrorBoundary><Relatorios /></ErrorBoundary>} />
            <Route path="/apresentacao" element={<ErrorBoundary><Presentation /></ErrorBoundary>} />
            <Route path="/manager" element={<ErrorBoundary><ManagerDashboard /></ErrorBoundary>} />
            <Route path="/historico-auditorias" element={<ErrorBoundary><AuditHistory /></ErrorBoundary>} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Full Screen Routes */}
          <Route path="/auditoria" element={<ErrorBoundary><AuditoriaApp /></ErrorBoundary>} />

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
        <BackgroundAuditorProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </BackgroundAuditorProvider>
      </AppDataProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
