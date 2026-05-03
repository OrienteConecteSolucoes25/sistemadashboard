import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Projetos from "./pages/Projetos";
import Adm from "./pages/Adm";
import MyCharacterPage from "./modules/pixel/ui/MyCharacterPage";
import PixelOfficePage from "./modules/pixel/ui/PixelOfficePage";
import PixelAdminPage from "./modules/pixel/ui/admin/PixelAdminPage";
import EngenhariaGuard from "./modules/engenharia/ui/EngenhariaGuard";
import EngenhariaDashboard from "./modules/engenharia/ui/EngenhariaDashboard";
import {
  EngSitesPage, EngRFIPage, EngPendenciasPage,
  EngMateriaisPage, EngEquipesPage, EngRelatoriosPage,
} from "./modules/engenharia/ui/EngPages";
import JuridicoGuard from "./modules/juridico/ui/JuridicoGuard";
import JuridicoDashboard from "./modules/juridico/ui/JuridicoDashboard";
import {
  JurProcessosPage, JurPrazosPage, JurDocumentosPage,
  JurResponsaveisPage, JurTarefasPage, JurRelatoriosPage,
} from "./modules/juridico/ui/JurPages";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Projetos />} />
              <Route path="pixel-office" element={<PixelOfficePage />} />
              <Route path="pixel-office/meu-personagem" element={<MyCharacterPage />} />
              <Route path="pixel-office/admin" element={<PixelAdminPage />} />
              <Route path="engenharia" element={<EngenhariaGuard />}>
                <Route index element={<EngenhariaDashboard />} />
                <Route path="sites" element={<EngSitesPage />} />
                <Route path="rfi" element={<EngRFIPage />} />
                <Route path="pendencias" element={<EngPendenciasPage />} />
                <Route path="materiais" element={<EngMateriaisPage />} />
                <Route path="equipes" element={<EngEquipesPage />} />
                <Route path="relatorios" element={<EngRelatoriosPage />} />
              </Route>
              <Route path="juridico" element={<JuridicoGuard />}>
                <Route index element={<JuridicoDashboard />} />
                <Route path="processos" element={<JurProcessosPage />} />
                <Route path="prazos" element={<JurPrazosPage />} />
                <Route path="documentos" element={<JurDocumentosPage />} />
                <Route path="responsaveis" element={<JurResponsaveisPage />} />
                <Route path="tarefas" element={<JurTarefasPage />} />
                <Route path="relatorios" element={<JurRelatoriosPage />} />
              </Route>
              <Route path="adm" element={<Adm />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
