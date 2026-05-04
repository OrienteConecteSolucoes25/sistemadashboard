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
import GovernancaPage from "./modules/engenharia/ui/GovernancaPage";
import ProjetosElaboracaoPage from "./modules/engenharia/ui/ProjetosElaboracaoPage";
import FibraPage from "./modules/engenharia/ui/FibraPage";
import SuprimentosPage from "./modules/engenharia/ui/SuprimentosPage";
import {
  AtividadesPage, DemandasPage, RfiPage, PendenciasPage, EnergiaPage, ArtPage,
  SitesPage, EquipesPage, MateriaisPage, RelatoriosPage, EmailsPage,
  IntegracoesPage, RoadmapPage, ConfiguracoesPage,
} from "./modules/engenharia/ui/EngOperacaoPages";
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
                <Route path="governanca" element={<GovernancaPage />} />
                <Route path="sites" element={<CrudPage config={SITES_CONFIG} />} />
                <Route path="projetos" element={<ProjetosElaboracaoPage />} />
                <Route path="demandas" element={<CrudPage config={DEMANDAS_CONFIG} />} />
                <Route path="atividades" element={<CrudPage config={ATIVIDADES_CONFIG} />} />
                <Route path="rfi" element={<CrudPage config={RFI_CONFIG} />} />
                <Route path="pendencias" element={<CrudPage config={PENDENCIAS_CONFIG} />} />
                <Route path="equipes" element={<CrudPage config={EQUIPES_CONFIG} />} />
                <Route path="fibra" element={<FibraPage />} />
                <Route path="energia" element={<CrudPage config={ENERGIA_CONFIG} />} />
                <Route path="materiais" element={<CrudPage config={MATERIAIS_CONFIG} />} />
                <Route path="suprimentos" element={<SuprimentosPage />} />
                <Route path="art" element={<CrudPage config={ART_CONFIG} />} />
                <Route path="relatorios" element={<CrudPage config={RELATORIOS_CONFIG} />} />
                <Route path="emails" element={<CrudPage config={EMAILS_CONFIG} />} />
                <Route path="integracoes" element={<CrudPage config={INTEGRACOES_CONFIG} />} />
                <Route path="roadmap-ia" element={<CrudPage config={ROADMAP_CONFIG} />} />
                <Route path="configuracoes" element={<CrudPage config={FIELD_OPTIONS_CONFIG} />} />
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
