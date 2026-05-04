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
import PlaceholderPage from "./modules/engenharia/ui/PlaceholderPage";
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
                <Route path="governanca" element={<GovernancaPage />} />
                <Route path="sites" element={<EngSitesPage />} />
                <Route path="projetos" element={<PlaceholderPage title="Projetos" description="Projetos de engenharia." table="eng_projetos" />} />
                <Route path="demandas" element={<PlaceholderPage title="Demandas" description="Demandas técnicas e de campo." table="eng_demandas" />} />
                <Route path="atividades" element={<PlaceholderPage title="Atividades" description="Atividades dos projetos." table="eng_atividades" />} />
                <Route path="rfi" element={<EngRFIPage />} />
                <Route path="pendencias" element={<EngPendenciasPage />} />
                <Route path="equipes" element={<EngEquipesPage />} />
                <Route path="fibra" element={<PlaceholderPage title="Fibra (obras)" description="Obras de fibra óptica." table="eng_fibra_obras" />} />
                <Route path="energia" element={<PlaceholderPage title="Ligações de Energia" description="Pedidos de ligação junto às concessionárias." table="eng_ligacoes_energia" />} />
                <Route path="materiais" element={<EngMateriaisPage />} />
                <Route path="suprimentos" element={<PlaceholderPage title="Suprimentos" description="Solicitações de compras." table="eng_suprimentos" />} />
                <Route path="art" element={<PlaceholderPage title="ART" description="Anotações de Responsabilidade Técnica." table="eng_art" />} />
                <Route path="relatorios" element={<EngRelatoriosPage />} />
                <Route path="emails" element={<PlaceholderPage title="E-mails (log)" description="Log de e-mails enviados pelo sistema." table="eng_emails_log" />} />
                <Route path="integracoes" element={<PlaceholderPage title="Integrações" description="Configuração de integrações externas." table="eng_integracoes" />} />
                <Route path="roadmap-ia" element={<PlaceholderPage title="Roadmap IA" description="Roadmap de iniciativas de IA." table="eng_roadmap_ia" />} />
                <Route path="configuracoes" element={<PlaceholderPage title="Configurações" description="Opções de campos e parâmetros." table="eng_field_options" />} />
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
