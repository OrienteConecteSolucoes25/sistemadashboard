import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, FolderKanban, LogOut, Settings, Gamepad2, HardHat, Scale, Menu, X, CreditCard, Building2, LayoutDashboard, HeartHandshake, Palette, FileSignature, MessageSquare, ChevronLeft, ChevronRight, ShieldAlert, Cpu, ShoppingBag, DollarSign, Store, Monitor, GraduationCap, BarChart3, Eye, Terminal, Share2, ShieldCheck } from "lucide-react";
import { usePlanosAccess } from "@/modules/planos/hooks/usePlanosAccess";
import { useEffect, useState } from "react";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AssistenteFloating } from "@/components/AssistenteFloating";
import { ImpersonationProvider } from "@/modules/planos/hooks/useImpersonation";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useUserLayoutPreference } from "@/modules/aparencia/hooks/useUserLayoutPreference";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAcl, useCan } from "@/acl/AclProvider";
import { useBrand } from "@/hooks/useBrand";
// Import Jarbas removido daqui para ser usado apenas dentro do Soluções-Verso

const AppLayout = () => {
  const { session, isAdmin, loading, signOut } = useAuth();
  const { loading: aclLoading } = useAcl();
  const { isFinanceiro, isCompanyAdmin, companyId, isOcsStaff, canSeeMinhaEmpresa } = usePlanosAccess();
  const canAparencia = useCan("aparencia.acessar");
  const canPlanos = useCan("planos.acessar");
  const canAdmVis = useCan("adm.visibilidade.visualizar");
  const canMarketplace = useCan("marketplace.dashboard.visualizar");
  const canEngenharia = useCan("engenharia.acessar");
  const canJuridico = useCan("juridico.acessar");
  const canRhdp = useCan("rhdp.acessar");
  const canCrea = useCan("crea.acessar");
  const canComunicacao = useCan("comunicacao.acessar");
  const canVisaoGeral = useCan("visao_geral.acessar");
  const canPixel = useCan("pixel_office.acessar");
  const canJarbas = useCan("jarbas.acessar");
  const canTI = useCan("ti.acessar");
  const canCompliance = useCan("compliance.acessar");
  const brand = useBrand();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const { collapsed, setCollapsed } = useUserLayoutPreference("__root__");

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  if (loading || aclLoading) return null;
  // Auth guard desativado: /app liberado sem login

  const NavItem = ({ to, icon: Icon, label }: any) => {
    const isActive = loc.pathname === to || loc.pathname.startsWith(to + "/");
    const cls = `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
      isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
    } ${collapsed ? "justify-center px-2" : ""}`;
    const node = (
      <Link to={to} className={cls}>
        <Icon className="w-4 h-4 shrink-0" /> {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
    if (!collapsed) return node;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  };

  const SidebarContent = (
    <TooltipProvider delayDuration={150}>
      <div className={`flex items-center justify-between mb-4 ${collapsed ? "flex-col gap-2" : ""}`}>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display font-bold text-lg">{brand.title}</div>
            {brand.subtitle && (
              <div className="text-[10px] text-muted-foreground -mt-0.5">{brand.subtitle}</div>
            )}
          </div>
        )}
        {collapsed && (
          <div className="font-display font-bold text-sm">
            {brand.showOcsBrand ? "OCS" : "SD"}
          </div>
        )}
        <div className="flex gap-1">
          <button
            className="hidden md:inline-flex p-1 rounded hover:bg-accent"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            className="md:hidden p-1 rounded hover:bg-accent"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Módulo Projetos removido por não ter ligação funcional com o Soluções-Verso */}
      {canVisaoGeral && <NavItem to="/app/visao-geral" icon={LayoutDashboard} label="Visão Geral" />}
      {canPixel && <NavItem to="/app/pixel-office" icon={Gamepad2} label="Soluções-Verso" />}
      {/* Jarbas oculto temporariamente — será liberado por empresa quando estiver pronto.
      {canJarbas && <NavItem to="/app/jarbas" icon={Cpu} label="Jarbas" />} */}
      {canTI && <NavItem to="/app/ti" icon={Monitor} label="TI & Suporte" />}
      {canCompliance && <NavItem to="/app/compliance" icon={ShieldCheck} label="Compliance" />}
      {canEngenharia && <NavItem to="/app/engenharia" icon={HardHat} label="Engenharia" />}
      {canJuridico && <NavItem to="/app/juridico" icon={Scale} label="Jurídico" />}
      {canRhdp && <NavItem to="/app/rh-dp" icon={HeartHandshake} label="RH/DP" />}
      {canCrea && <NavItem to="/app/crea" icon={FileSignature} label="CREA & ART" />}
      {canComunicacao && <NavItem to="/app/comunicacao" icon={MessageSquare} label="Comunicação OCS" />}
      {(isFinanceiro || canPlanos) && <NavItem to="/app/planos" icon={CreditCard} label="Planos" />}
      {canSeeMinhaEmpresa && <NavItem to="/app/minha-empresa" icon={Building2} label="Minha Empresa" />}
      {(isAdmin || canAparencia) && <NavItem to="/app/aparencia" icon={Palette} label="Aparência & Marca" />}
      
      {(isOcsStaff || canAdmVis) && <NavItem to="/app/adm" icon={Settings} label="ADM — Visibilidade" />}
      {canMarketplace && <NavItem to="/app/marketplace" icon={Store} label="Marketplace" />}
      <div className="mt-auto pt-4 border-t">
        {!collapsed && (
          <>
            <div className="text-xs text-muted-foreground mb-2 truncate">{session.user.email}</div>
            {isAdmin && (
              <div className="text-xs flex items-center gap-1 text-primary mb-2">
                <Shield className="w-3 h-3" /> Admin
              </div>
            )}
          </>
        )}
        <Button variant="outline" size="sm" className={`w-full ${collapsed ? "px-0" : ""}`} onClick={signOut}>
          <LogOut className="w-4 h-4" /> {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </TooltipProvider>
  );

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <ImpersonationProvider>
    <div className="min-h-screen flex bg-background text-foreground">
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 h-14 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button className="p-2 rounded-md hover:bg-accent" onClick={() => setOpen(true)} aria-label="Abrir menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="leading-tight text-center">
          <div className="font-display font-bold text-sm">{brand.title}</div>
          {brand.subtitle && (
            <div className="text-[9px] text-muted-foreground -mt-0.5">{brand.subtitle}</div>
          )}
        </div>
        <NotificationsBell />
      </header>

      <div className="hidden md:block fixed top-3 right-4 z-30">
        <NotificationsBell />
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 ${open ? "w-64" : sidebarWidth} border-r p-4 flex flex-col gap-2 bg-background transition-[width,transform] duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        {SidebarContent}
      </aside>

      <main
        className="flex-1 overflow-auto pt-14 md:pt-0"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <OfflineBanner />
        <ImpersonationBanner />
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
      <AssistenteFloating />
    </div>
    </ImpersonationProvider>
  );
};

export default AppLayout;
