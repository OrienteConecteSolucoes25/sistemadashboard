import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, FolderKanban, LogOut, Settings, User, Gamepad2 } from "lucide-react";

const AppLayout = () => {
  const { session, isAdmin, loading, signOut } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;

  const NavItem = ({ to, icon: Icon, label }: any) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
        loc.pathname === to ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r p-4 flex flex-col gap-2">
        <div className="font-bold text-lg mb-4">OCS</div>
        <NavItem to="/app" icon={FolderKanban} label="Projetos" />
        <NavItem to="/app/pixel-office" icon={Gamepad2} label="Pixel Office" />
        <NavItem to="/app/pixel-office/meu-personagem" icon={User} label="Meu Personagem" />
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
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
