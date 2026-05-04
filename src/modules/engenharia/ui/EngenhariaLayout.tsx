import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ENG_TABS } from "./engTabs";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const EngenhariaLayout = () => {
  const loc = useLocation();
  const groups = useMemo(() => {
    const map = new Map<string, typeof ENG_TABS>();
    ENG_TABS.forEach((t) => {
      if (!map.has(t.group)) map.set(t.group, [] as any);
      (map.get(t.group) as any).push(t);
    });
    return Array.from(map.entries());
  }, []);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(([g]) => [g, true]))
  );

  return (
    <div className="flex gap-4">
      <aside className="w-60 shrink-0 hidden md:block">
        <div className="sticky top-4 space-y-3">
          {groups.map(([group, tabs]) => (
            <div key={group} className="border rounded-md">
              <button
                onClick={() => setOpen({ ...open, [group]: !open[group] })}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                <span>{group.toUpperCase()}</span>
                {open[group] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {open[group] && (
                <div className="p-1">
                  {tabs.map((t) => {
                    const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
                    return (
                      <NavLink
                        key={t.to}
                        to={t.to}
                        end={t.end}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                          active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                        }`}
                      >
                        <t.icon className="w-4 h-4" /> {t.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Engenharia</h1>
            <p className="text-sm text-muted-foreground">Módulo migrado do Oriente — schema próprio (eng_*).</p>
          </div>
          <Badge variant="outline">Leva 1</Badge>
        </div>

        {/* Mobile dropdown nav */}
        <nav className="md:hidden flex flex-wrap gap-1 border-b pb-2">
          {ENG_TABS.map((t) => {
            const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <t.icon className="w-3 h-3" /> {t.label}
              </NavLink>
            );
          })}
        </nav>

        <Outlet />
      </div>
    </div>
  );
};

export default EngenhariaLayout;
