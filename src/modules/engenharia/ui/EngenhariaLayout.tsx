import { Outlet, useLocation, NavLink } from "react-router-dom";
import { ENG_TABS } from "./engTabs";
import { useMemo } from "react";
import { Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { CollapsibleModuleSidebar } from "@/modules/aparencia/ui/CollapsibleModuleSidebar";
import { EngDemoToggle, EngDemoBanner } from "./components/EngDemoToggle";

const EngenhariaLayout = () => {
  const loc = useLocation();
  const { has, isAdmin, ready } = useUserModules();
  const visibleTabs = useMemo(() => {
    if (!ready) return ENG_TABS;
    return ENG_TABS.filter((t) => {
      if (t.systemOnly) return isAdmin;
      if (!t.moduleKey) return true;
      return has(t.moduleKey);
    });
  }, [ready, isAdmin, has]);

  return (
    <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
      <CollapsibleModuleSidebar
        moduleKey="engenharia"
        moduleTitle="Engenharia"
        moduleSubtitle="ERP OCS"
        moduleIcon={Hammer}
        tabs={visibleTabs.map(t => ({ to: t.to, label: t.label, icon: t.icon, end: t.end, group: t.group }))}
      />
      <div className="flex-1 min-w-0 bg-background flex flex-col">
        <EngDemoBanner />
        <div className="hidden md:flex justify-end px-4 pt-3">
          <EngDemoToggle />
        </div>
        <nav className="md:hidden flex overflow-x-auto gap-1 border-b px-3 py-2 bg-card pl-12">
          {visibleTabs.map((t) => {
            const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
            return (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={cn("flex items-center gap-1 px-2 py-1 text-xs rounded whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <t.icon className="w-3 h-3" />{t.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 lg:p-6 min-w-0 flex-1"><Outlet /></div>
      </div>
    </div>
  );
};

export default EngenhariaLayout;
