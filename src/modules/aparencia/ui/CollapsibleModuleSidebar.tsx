import { ReactNode, useEffect, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, Menu, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserLayoutPreference } from "../hooks/useUserLayoutPreference";

export interface SidebarTab {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  group: string;
}

interface Props {
  moduleKey: string;          // ex "engenharia", "juridico"
  moduleTitle: string;
  moduleSubtitle?: string;
  moduleIcon: LucideIcon;
  tabs: SidebarTab[];
  footerNote?: string;
}

export function CollapsibleModuleSidebar({ moduleKey, moduleTitle, moduleSubtitle, moduleIcon: Icon, tabs, footerNote }: Props) {
  const loc = useLocation();
  const { collapsed, setCollapsed } = useUserLayoutPreference(moduleKey);
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = Array.from(new Set(tabs.map(t => t.group)));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(g => [g, true]))
  );

  const renderTab = (t: SidebarTab) => {
    const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
    const Comp = (
      <NavLink
        to={t.to}
        end={t.end}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
          collapsed && "justify-center px-2",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <t.icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span className="truncate">{t.label}</span>}
      </NavLink>
    );
    if (collapsed) {
      return (
        <Tooltip key={t.to} delayDuration={0}>
          <TooltipTrigger asChild>{Comp}</TooltipTrigger>
          <TooltipContent side="right">{t.label}</TooltipContent>
        </Tooltip>
      );
    }
    return <div key={t.to}>{Comp}</div>;
  };

  const sidebarBody = (
    <TooltipProvider>
      <div className={cn("h-full flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200", collapsed ? "w-14" : "w-60")}>
        <div className={cn("border-b border-sidebar-border flex items-center", collapsed ? "px-2 py-3 justify-center" : "px-3 py-4 gap-2")}>
          <div className="w-8 h-8 rounded-md bg-sidebar-primary/20 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="font-display font-semibold text-sm leading-none truncate">{moduleTitle}</div>
              {moduleSubtitle && <div className="text-[11px] text-sidebar-foreground/60 mt-0.5 truncate">{moduleSubtitle}</div>}
            </div>
          )}
          {!collapsed && (
            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-sidebar-accent text-sidebar-foreground" onClick={() => setCollapsed(true)} title="Recolher menu">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-2">
          {collapsed ? (
            <div className="space-y-1">{tabs.map(renderTab)}</div>
          ) : (
            groups.map(group => (
              <div key={group}>
                <button
                  onClick={() => setOpenGroups(o => ({ ...o, [group]: !o[group] }))}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground"
                >
                  <span>{group.toUpperCase()}</span>
                  {openGroups[group] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {openGroups[group] && (
                  <div className="mt-1 space-y-0.5">
                    {tabs.filter(t => t.group === group).map(renderTab)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {collapsed ? (
          <div className="p-2 border-t border-sidebar-border flex justify-center">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground" onClick={() => setCollapsed(false)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          footerNote && (
            <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/50">{footerNote}</div>
          )
        )}
      </div>
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block shrink-0">{sidebarBody}</aside>

      {/* Mobile trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="md:hidden fixed top-14 left-2 z-30 h-8 px-2">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-sidebar-border">
          {sidebarBody}
        </SheetContent>
      </Sheet>
    </>
  );
}
