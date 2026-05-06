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
  RelatoriosPage, EmailsPage, IntegracoesPage, RoadmapPage, ConfiguracoesPage,
} from "./modules/engenharia/ui/EngOperacaoPages";
import { SitesDeluxePage, EquipesDeluxePage, MateriaisDeluxePage } from "./modules/engenharia/ui/EngDeluxePages";
import ObrasPage from "./modules/engenharia/ui/ObrasPage";
import EngRastreabilidadePage from "./modules/engenharia/ui/EngRastreabilidadePage";
import EngAdminPage from "./modules/engenharia/ui/EngAdminPage";
import JuridicoGuard from "./modules/juridico/ui/JuridicoGuard";
import JuridicoDashboard from "./modules/juridico/ui/JuridicoDashboard";
import {
  JurProcessosPage, JurPrazosPage, JurDocumentosPage,
  JurResponsaveisPage, JurTarefasPage, JurRelatoriosPage,
} from "./modules/juridico/ui/JurPages";
import PlanosPage from "./modules/planos/ui/PlanosPage";
import RhdpGuard from "./modules/rhdp/ui/RhdpGuard";
import {
  RhdpDashboard,
} from "./modules/rhdp/ui/RhdpPages";
import FolhaPage from "./modules/rhdp/ui/FolhaPage";
import IndicadoresPage from "./modules/rhdp/ui/IndicadoresPage";
import BeneficiosPage from "./modules/rhdp/ui/BeneficiosPage";
import FeriasPage from "./modules/rhdp/ui/FeriasPage";
import SolicitacoesPage from "./modules/rhdp/ui/SolicitacoesPage";
import RecrutamentoPage from "./modules/rhdp/ui/RecrutamentoPage";
import ColaboradoresPage from "./modules/rhdp/ui/ColaboradoresPage";
import RhdpPermissoesPage from "./modules/rhdp/ui/RhdpPermissoesPage";
import AdmissaoPage from "./modules/rhdp/ui/AdmissaoPage";
import ContratosPage from "./modules/rhdp/ui/ContratosPage";
import PontoPage from "./modules/rhdp/ui/PontoPage";
import MinhaEmpresaPage from "./modules/planos/ui/MinhaEmpresaPage";
import ThemeStudioPage from "./modules/aparencia/ui/ThemeStudioPage";
import { CompanyThemeProvider } from "./modules/aparencia/hooks/CompanyThemeProvider";
import VisaoGeralPage from "./modules/planos/ui/VisaoGeralPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyThemeProvider>
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
                <Route path="sites" element={<ObrasPage />} />
                <Route path="obras" element={<ObrasPage />} />
                <Route path="projetos" element={<ProjetosElaboracaoPage />} />
                <Route path="demandas" element={<DemandasPage />} />
                <Route path="atividades" element={<AtividadesPage />} />
                <Route path="rfi" element={<RfiPage />} />
                <Route path="pendencias" element={<PendenciasPage />} />
                <Route path="equipes" element={<EquipesDeluxePage />} />
                <Route path="fibra" element={<FibraPage />} />
                <Route path="energia" element={<EnergiaPage />} />
                <Route path="materiais" element={<MateriaisDeluxePage />} />
                <Route path="suprimentos" element={<SuprimentosPage />} />
                <Route path="art" element={<ArtPage />} />
                <Route path="relatorios" element={<RelatoriosPage />} />
                <Route path="emails" element={<EmailsPage />} />
                <Route path="integracoes" element={<IntegracoesPage />} />
                <Route path="roadmap-ia" element={<RoadmapPage />} />
                <Route path="configuracoes" element={<ConfiguracoesPage />} />
                <Route path="rastreabilidade" element={<EngRastreabilidadePage />} />
                <Route path="auditoria" element={<EngRastreabilidadePage />} />
                <Route path="admin" element={<EngAdminPage />} />
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
              <Route path="rh-dp" element={<RhdpGuard />}>
                <Route index element={<RhdpDashboard />} />
                <Route path="colaboradores" element={<ColaboradoresPage />} />
                <Route path="recrutamento" element={<RecrutamentoPage />} />
                <Route path="beneficios" element={<BeneficiosPage />} />
                <Route path="solicitacoes" element={<SolicitacoesPage />} />
                <Route path="admissao" element={<AdmissaoPage />} />
                <Route path="contratos" element={<ContratosPage />} />
                <Route path="ponto" element={<PontoPage />} />
                <Route path="ferias" element={<FeriasPage />} />
                <Route path="folha" element={<FolhaPage />} />
                <Route path="indicadores" element={<IndicadoresPage />} />
                <Route path="permissoes" element={<RhdpPermissoesPage />} />
              </Route>
              <Route path="planos" element={<PlanosPage />} />
              <Route path="minha-empresa" element={<MinhaEmpresaPage />} />
              <Route path="visao-geral" element={<VisaoGeralPage />} />
              <Route path="adm" element={<Adm />} />
              <Route path="aparencia" element={<ThemeStudioPage />} />
              <Route path="design-system" element={<ThemeStudioPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CompanyThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
