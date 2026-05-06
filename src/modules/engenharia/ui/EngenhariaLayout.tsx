import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ENG_TABS } from "./engTabs";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";

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
  const groups = useMemo(() => {
    const map = new Map<string, typeof visibleTabs>();
    visibleTabs.forEach((t) => {
      if (!map.has(t.group)) map.set(t.group, [] as any);
      (map.get(t.group) as any).push(t);
    });
    return Array.from(map.entries());
  }, [visibleTabs]);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(([g]) => [g, true]))
  );

  return (
    <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
      {/* Sidebar dark */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
            <Hammer className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-display font-semibold text-sm leading-none">Engenharia</div>
            <div className="text-[11px] text-sidebar-foreground/60 mt-0.5">ERP OCS</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
          {groups.map(([group, tabs]) => (
            <div key={group}>
              <button
                onClick={() => setOpen({ ...open, [group]: !open[group] })}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground"
              >
                <span>{group.toUpperCase()}</span>
                {open[group] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {open[group] && (
                <div className="mt-1 space-y-0.5">
                  {tabs.map((t) => {
                    const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
                    return (
                      <NavLink
                        key={t.to}
                        to={t.to}
                        end={t.end}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                          active
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <t.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 bg-background">
        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto gap-1 border-b px-3 py-2 bg-card">
          {visibleTabs.map((t) => {
            const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs rounded whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default EngenhariaLayout;
