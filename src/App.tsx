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
import TvLayout from "./components/Layout/TvLayout";
import Index from "./pages/Index";
import Crm from "./pages/Crm";
import Gerentes from "./pages/Gerentes";
import Config from "./pages/Config";
import Relatorios from "./pages/Relatorios";
import Presentation from "./pages/Presentation";
import TvOperacional from "./pages/tv/TvOperacional";
import TvExecutivo from "./pages/tv/TvExecutivo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppDataProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Rota Pública */}
                <Route path="/login" element={<Login />} />
                
                {/* Rotas Privadas */}
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

                  {/* Rotas de TV (sem sidebar, edge-to-edge) */}
                  <Route element={<TvLayout />}>
                    <Route path="/tv/operacional" element={<TvOperacional />} />
                    <Route path="/tv/executivo" element={<TvExecutivo />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AppDataProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
