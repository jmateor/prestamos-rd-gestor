import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Solicitudes from "./pages/Solicitudes";
import Prestamos from "./pages/Prestamos";
import Cobranza from "./pages/Cobranza";
import Garantias from "./pages/Garantias";
import Reportes from "./pages/Reportes";
import Ajustes from "./pages/Ajustes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
    <Route path="/solicitudes" element={<ProtectedRoute><Solicitudes /></ProtectedRoute>} />
    <Route path="/prestamos" element={<ProtectedRoute><Prestamos /></ProtectedRoute>} />
    <Route path="/cobranza" element={<ProtectedRoute><Cobranza /></ProtectedRoute>} />
    <Route path="/garantias" element={<ProtectedRoute><Garantias /></ProtectedRoute>} />
    <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
    <Route path="/ajustes" element={<ProtectedRoute><Ajustes /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
