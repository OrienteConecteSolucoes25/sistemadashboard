import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, FolderKanban, LogOut, Settings, User, Gamepad2, HardHat, Scale, Menu, X, CreditCard, Building2, LayoutDashboard, HeartHandshake, Palette, FileSignature } from "lucide-react";
import { useRhdpAccess } from "@/modules/rhdp/hooks/useRhdpAccess";
import { useCreaAccess } from "@/modules/crea/hooks/useCreaAccess";
import { useEngenhariaAccess } from "@/modules/engenharia/hooks/useEngenhariaAccess";
import { useJuridicoAccess } from "@/modules/juridico/hooks/useJuridicoAccess";
import { usePlanosAccess } from "@/modules/planos/hooks/usePlanosAccess";
import { useEffect, useState } from "react";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AssistenteFloating } from "@/components/AssistenteFloating";
import { ImpersonationProvider } from "@/modules/planos/hooks/useImpersonation";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

const AppLayout = () => {
  const { session, isAdmin, loading, signOut } = useAuth();
  const { hasAccess: engAccess } = useEngenhariaAccess();
  const { hasAccess: jurAccess } = useJuridicoAccess();
  const { isFinanceiro, isCompanyAdmin, companyId } = usePlanosAccess();
  const { hasAccess: rhdpAccess } = useRhdpAccess();
  const { hasAccess: creaAccess } = useCreaAccess();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;

  const NavItem = ({ to, icon: Icon, label }: any) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
        loc.pathname === to || loc.pathname.startsWith(to + "/")
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </Link>
  );

  const SidebarContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-lg">OCS</div>
        <button
          className="md:hidden p-1 rounded hover:bg-accent"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <NavItem to="/app" icon={FolderKanban} label="Projetos" />
      <NavItem to="/app/visao-geral" icon={LayoutDashboard} label="Visão Geral" />
      <NavItem to="/app/pixel-office" icon={Gamepad2} label="Pixel Office" />
      <NavItem to="/app/pixel-office/meu-personagem" icon={User} label="Meu Personagem" />
      {engAccess && <NavItem to="/app/engenharia" icon={HardHat} label="Engenharia" />}
      {jurAccess && <NavItem to="/app/juridico" icon={Scale} label="Jurídico" />}
      {rhdpAccess && <NavItem to="/app/rh-dp" icon={HeartHandshake} label="RH/DP" />}
      {creaAccess && <NavItem to="/app/crea" icon={FileSignature} label="CREA & ART" />}
      {isFinanceiro && <NavItem to="/app/planos" icon={CreditCard} label="Planos" />}
      {companyId && <NavItem to="/app/minha-empresa" icon={Building2} label="Minha Empresa" />}
      {isAdmin && <NavItem to="/app/aparencia" icon={Palette} label="Aparência & Marca" />}
      {isAdmin && <NavItem to="/app/pixel-office/admin" icon={Shield} label="Pixel Admin" />}
      {isAdmin && <NavItem to="/app/adm" icon={Settings} label="ADM — Visibilidade" />}
      <div className="mt-auto pt-4 border-t">
        <div className="text-xs text-muted-foreground mb-2 truncate">{session.user.email}</div>
        {isAdmin && (
          <div className="text-xs flex items-center gap-1 text-primary mb-2">
            <Shield className="w-3 h-3" /> Admin
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>
    </>
  );

  return (
    <ImpersonationProvider>
    <div className="min-h-screen flex bg-background text-foreground">
      <ImpersonationBanner />
      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 h-14 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          className="p-2 rounded-md hover:bg-accent"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="font-bold">OCS</div>
        <NotificationsBell />
      </header>

      {/* Desktop floating bell */}
      <div className="hidden md:block fixed top-3 right-4 z-30">
        <NotificationsBell />
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — desktop static / mobile drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r p-4 flex flex-col gap-2 bg-background transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        {SidebarContent}
      </aside>

      <main
        className="flex-1 p-4 md:p-6 overflow-auto pt-20 md:pt-6"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <Outlet />
      </main>
      <AssistenteFloating />
    </div>
    </ImpersonationProvider>
  );
};

export default AppLayout;
