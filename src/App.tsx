import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AclProvider } from "@/acl/AclProvider";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
// Import Projetos removido
import Adm from "./pages/Adm";
import SolucoesVersoPage from "./modules/pixel/ui/SolucoesVersoPage";
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
import { SitesDeluxePage, MateriaisDeluxePage } from "./modules/engenharia/ui/EngDeluxePages";
import { FornecedoresPage } from "./modules/engenharia/ui/FornecedoresPage";
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
// Import removido
import AdmissaoPage from "./modules/rhdp/ui/AdmissaoPage";
import ContratosPage from "./modules/rhdp/ui/ContratosPage";
import PontoPage from "./modules/rhdp/ui/PontoPage";
import MinhaEmpresaPage from "./modules/planos/ui/MinhaEmpresaPage";
import CreaGuard from "./modules/crea/ui/CreaGuard";
import CreaDashboard from "./modules/crea/ui/CreaDashboard";
import CreaAdminPage from "./modules/crea/ui/CreaAdminPage";
import CreaIntegracoesPage from "./modules/crea/ui/CreaIntegracoesPage";
import CreaGovernancaPage from "./modules/crea/governanca/CreaGovernancaPage";
import {
  ArtsPage as CreaArtsPage, ProtocolosPage as CreaProtocolosPage, CatsPage as CreaCatsPage,
  CertidoesPage as CreaCertidoesPage, BaixasPage as CreaBaixasPage, TratativasPage as CreaTratativasPage,
  PrazosPage as CreaPrazosPage, RtsPage as CreaRtsPage, EmpresasPage as CreaEmpresasPage,
  DocumentosPage as CreaDocumentosPage, NormasPage as CreaNormasPage, LinksPage as CreaLinksPage,
  CredenciaisPage as CreaCredenciaisPage, AssistentePage as CreaAssistentePage, AuditoriaPage as CreaAuditoriaPage,
} from "./modules/crea/ui/CreaPages";
import ComunicacaoLayout from "./modules/comunicacao/ui/ComunicacaoLayout";
import ComunicacaoDashboard from "./modules/comunicacao/ui/ComunicacaoDashboard";
import {
  BrandKitsPage, PostGeneratorPage, LegendaGeneratorPage, TextoGeneratorPage, PostsListPage,
  AprovacoesPage, CalendarioPage, CarrosselGeneratorPage, NewsletterGeneratorPage,
  InternaGeneratorPage, CampanhaGeneratorPage, NewslettersListPage, InternaListPage,
  CarrosseisListPage, CampanhasListPage, ProdutoListPage, PublicacoesListPage,
  IdeiasPage, PromptsPage, AuditoriaPage as CommAuditoriaPage,
} from "./modules/comunicacao/ui/ComunicacaoPages";
import { DesignStudioPage, ImagesGalleryPage, CanvaPage } from "./modules/comunicacao/ui/ComunicacaoStudio";
import IntegracoesSociaisPage from "./modules/comunicacao/ui/IntegracoesSociaisPage";
import MetricasPage from "./modules/comunicacao/ui/MetricasPage";
import ThemeStudioPage from "./modules/aparencia/ui/ThemeStudioPage";
import { CompanyThemeProvider } from "./modules/aparencia/hooks/CompanyThemeProvider";
import VisaoGeralPage from "./modules/planos/ui/VisaoGeralPage";
import { GovernanceUniversalPage } from "./modules/governance/ui/GovernanceUniversalPage";
import OcsGuardPage from "./modules/ocs-guard/ui/OcsGuardPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AclProvider>
          <CompanyThemeProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/pixel-office" replace />} />
              <Route path="pixel-office" element={<SolucoesVersoPage />} />
              <Route path="pixel-office/meu-personagem" element={<SolucoesVersoPage />} />
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
                <Route path="equipes" element={<FornecedoresPage />} />
                <Route path="fornecedores" element={<FornecedoresPage />} />
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
                <Route path="governanca" element={<GovernanceUniversalPage moduleKey="juridico" />} />
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
                {/* Rota de permissões legada removida */}
              </Route>
              <Route path="crea" element={<CreaGuard />}>
                <Route index element={<CreaDashboard />} />
                <Route path="arts" element={<CreaArtsPage />} />
                <Route path="protocolos" element={<CreaProtocolosPage />} />
                <Route path="cats" element={<CreaCatsPage />} />
                <Route path="certidoes" element={<CreaCertidoesPage />} />
                <Route path="baixas" element={<CreaBaixasPage />} />
                <Route path="tratativas" element={<CreaTratativasPage />} />
                <Route path="prazos" element={<CreaPrazosPage />} />
                <Route path="rts" element={<CreaRtsPage />} />
                <Route path="empresas" element={<CreaEmpresasPage />} />
                <Route path="documentos" element={<CreaDocumentosPage />} />
                <Route path="credenciais" element={<CreaCredenciaisPage />} />
                <Route path="normas" element={<CreaNormasPage />} />
                <Route path="links" element={<CreaLinksPage />} />
                <Route path="assistente" element={<CreaAssistentePage />} />
                <Route path="auditoria" element={<CreaAuditoriaPage />} />
                <Route path="admin" element={<CreaAdminPage />} />
                <Route path="integracoes" element={<CreaIntegracoesPage />} />
                <Route path="governanca" element={<CreaGovernancaPage />} />
              </Route>
              <Route path="rh-dp/governanca" element={<GovernanceUniversalPage moduleKey="rhdp" />} />
              <Route path="comunicacao" element={<ComunicacaoLayout />}>
                <Route index element={<ComunicacaoDashboard />} />
                <Route path="calendario" element={<CalendarioPage />} />
                <Route path="posts" element={<PostGeneratorPage />} />
                <Route path="posts/lista" element={<PostsListPage />} />
                <Route path="legendas" element={<LegendaGeneratorPage />} />
                <Route path="textos" element={<TextoGeneratorPage />} />
                <Route path="carrosseis" element={<CarrosselGeneratorPage />} />
                <Route path="carrosseis/lista" element={<CarrosseisListPage />} />
                <Route path="newsletters" element={<NewsletterGeneratorPage />} />
                <Route path="newsletters/lista" element={<NewslettersListPage />} />
                <Route path="interna" element={<InternaGeneratorPage />} />
                <Route path="interna/lista" element={<InternaListPage />} />
                <Route path="design-studio" element={<DesignStudioPage />} />
                <Route path="imagens-ia" element={<ImagesGalleryPage />} />
                <Route path="canva" element={<CanvaPage />} />
                <Route path="campanhas" element={<CampanhaGeneratorPage />} />
                <Route path="campanhas/lista" element={<CampanhasListPage />} />
                <Route path="produto" element={<ProdutoListPage />} />
                <Route path="ideias" element={<IdeiasPage />} />
                <Route path="prompts" element={<PromptsPage />} />
                <Route path="aprovacoes" element={<AprovacoesPage />} />
                <Route path="publicacoes" element={<PublicacoesListPage />} />
                <Route path="marca" element={<BrandKitsPage />} />
                <Route path="integracoes" element={<IntegracoesSociaisPage />} />
                <Route path="metricas" element={<MetricasPage />} />
                <Route path="auditoria" element={<CommAuditoriaPage />} />
              </Route>
              <Route path="comunicacao/governanca" element={<GovernanceUniversalPage moduleKey="comunicacao" />} />
              <Route path="governanca" element={<GovernanceUniversalPage moduleKey="geral" />} />
              <Route path="planos" element={<PlanosPage />} />
              <Route path="minha-empresa" element={<MinhaEmpresaPage />} />
              <Route path="visao-geral" element={<VisaoGeralPage />} />
              <Route path="adm" element={<Adm />} />
               <Route path="ocs-guard" element={<OcsGuardPage />} />
               <Route path="aparencia" element={<ThemeStudioPage />} />
              <Route path="design-system" element={<ThemeStudioPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CompanyThemeProvider>
          </AclProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
